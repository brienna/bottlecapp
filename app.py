from flask import Flask, render_template, Markup, flash, redirect, url_for, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from marshmallow import Schema, fields
from flask_wtf import Form
from wtforms import StringField, PasswordField
from wtforms.validators import DataRequired
import os
from werkzeug import secure_filename
import flask.ext.login as flask_login
import bcrypt
from rauth import OAuth2Service

# Initialize the Flask application and set configurations
bottlecapp = Flask(__name__)
bottlecapp.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
bottlecapp.config['SECRET_KEY'] = 'important to keep unknown in production' # for form
bottlecapp.config['UPLOAD_FOLDER'] = 'static/caps/'
bottlecapp.config['ALLOWED_EXTENSIONS'] = set(['png'])
bottlecapp.config['OAUTH_CREDENTIALS'] = {
    'facebook': {
        'id': '1694391720826669',
        'secret': '013d8ade6b15271054f551b31f309231'
    }
}

# create db instance and bind it to the app
db = SQLAlchemy(bottlecapp)  

# set up the login manager by instantiating it and telling it about the app
login_manager = flask_login.LoginManager()
login_manager.init_app(bottlecapp)

# rauth OAuth 2.0 service wrapper
facebook = OAuth2Service(
    name = 'facebook',
    client_id = bottlecapp.config['OAUTH_CREDENTIALS']['facebook']['id'],
    client_secret = bottlecapp.config['OAUTH_CREDENTIALS']['facebook']['secret'],
    authorize_url = 'https://www.facebook.com/dialog/oauth',
    access_token_url = 'https://graph.facebook.com/oauth/access_token',
    base_url = 'https://graph.facebook.com/')

class User(db.Model):
    '''A class definition for a user object.'''
    id = db.Column(db.Integer, primary_key=True)
    authenticated = db.Column(db.Boolean, default=False)
    nickname = db.Column(db.String)
    
    # user credentials
    username = db.Column(db.String, unique=True)
    email = db.Column(db.String, unique=True)
    password = db.Column(db.String)
    
    # define one to many relationship with child table
    caps = db.relationship('Cap', backref='user', lazy='dynamic')

    def __init__(self, **kwargs):
        self.username = kwargs.get('social_id')
        self.email = kwargs.get('email')
        self.password = kwargs.get('password')

    def __repr__(self):
        '''Return string representation to use in debugging.'''
        return '<User {0}, {1}, {2}>'.format(self.username, self.email, self.password)

    def is_active(self):
        '''Return True, as all users are active.'''
        return True

    def get_id(self):
        '''Return the id to satisfy Flask-Login's requirements.'''
        return self.id

    def is_authenticated(self):
        '''Return True if the user is authenticated (logged in).'''
        return self.authenticated

    def is_anonymous(self):
        '''False, as anonymous users aren't supported.'''
        return False

    def create_folder(self, name):
        '''Create a user folder (at registration).'''
        newpath = bottlecapp.config['UPLOAD_FOLDER'] + name
        if not os.path.exists(newpath):
            os.makedirs(newpath)

@login_manager.user_loader
def load_user(user_id):
    '''Loads user object from database, using the user id stored in the session.'''
    return User.query.get(user_id)


@bottlecapp.route('/', methods=['GET', 'POST'])
def login():
    '''For GET requests, display the login form. For POSTS, login the current user
    by processing the form.'''
    users = User.query.all()
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user:
            # encode password input in unicode
            pw_bytes = form.password.data.encode('utf-8')
            if bcrypt.hashpw(pw_bytes, user.password) == user.password:
                user.authenticated = True
                db.session.add(user)
                db.session.commit()
                flask_login.login_user(user, remember=True)
                return redirect(url_for('gallery'))
            else:
                # Incorrect password, flash message
                flash('incorrect password')
        else:
            # New user, flash message
            flash('New user, please sign up')
    return render_template('login.html', form=form, users=users, button='Log in')


@bottlecapp.route('/logout', methods=['GET'])
@flask_login.login_required
def logout():
    '''Logout the current user.'''
    user = flask_login.current_user
    user.authenticated = False
    db.session.add(user)
    db.session.commit()
    flask_login.logout_user()
    return redirect(url_for('login'))

@bottlecapp.route('/facebook/login')
def facebook_login():
    # If user is already logged into app
    if flask_login.current_user.is_active:
        # Skip authorization phase
        return redirect(url_for('gallery'))
    else:
        # Begin authorization phase
        return redirect(facebook.get_authorize_url(
            scope = 'public_profile, email',
            response_type = 'code',
            redirect_uri = url_for('authorized', _external=True)))

@bottlecapp.route('/facebook/authorized')
def authorized():
    if not 'code' in request.args:
        flash('You did not authorize the request')
        return redirect(url_for('login'))

    # Request access token credentials using 'code'
    redirect_uri = url_for('authorized', _external=True)
    data = dict(code=request.args['code'], redirect_uri=redirect_uri)
    session = facebook.get_auth_session(data=data)

    # the me response
    me = session.get('/me?fields=id,email').json()
    social_id = me['id']
    user = User.query.filter_by(username=social_id).first()
    if user is None:
        flash('New user')
        # Create new user
        email = me.get('email')
        user = User(social_id = social_id, email=email)
        db.session.add(user)
        db.session.commit()
        # Create new user folder
        user.create_folder(social_id)
    flask_login.login_user(user, remember=True)
    user.authenticated = True
    flash('Logged in as ' + social_id)
    return redirect(url_for('gallery'))

@bottlecapp.route('/signup', methods=['GET', 'POST'])
def signup():
    '''Sign the user up.'''
    form = LoginForm()
    users = User.query.all()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user is None:
            # create new user, hashing password with a randomly-generated salt
            username = form.username.data
            pw_bytes = form.password.data.encode('utf-8')
            password = bcrypt.hashpw(pw_bytes, bcrypt.gensalt())
            user = User(social_id=username, password=password)
            db.session.add(user)
            db.session.commit()
            # Create new user folder
            user.create_folder(username)
            return redirect(url_for('login'))
        else:
            flash('Existing user. Please choose a different name or log in')
    return render_template('login.html', form=form, users=users, button='register')


class LoginForm(Form):
    '''A class definition for the login form object.

    Attributes:
        username (object) - StringField(label text, validators)
        password (object) - PasswordField(label text, validators)
    '''
    username = StringField('Email address ', validators=[DataRequired()])
    password = PasswordField('Password ', validators=[DataRequired()])


class Cap(db.Model):
    '''A class definition of a cap object.'''
    # create db table columns
    id = db.Column(db.Integer, primary_key=True)  # primary key
    date = db.Column(db.Integer)          
    path = db.Column(db.String(80))

    # define foreign key on child table
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    def __init__(self, date, path, user_id):
        self.date = date
        self.path = path
        self.user_id = user_id

    def __repr__(self):
        '''Return string representation to use in debugging.'''
        return '<Cap {0}, {1}, {2}>'.format(self.date, self.path, self.user_id)

    def allowed_ext(filename):
        '''For a given file, return whether or not it's an allowed type.'''
        return filename.rsplit('.')[1] in bottlecapp.config['ALLOWED_EXTENSIONS']

    def add():
        '''Add cap to database if it has not already been added'''
        username = flask_login.current_user.username
        user_id = flask_login.current_user.get_id()
        caps_dir = bottlecapp.config['UPLOAD_FOLDER'] + username + '/'
        for file in os.listdir(caps_dir):
            path = caps_dir + os.path.relpath(file)  # note: use relpath to later accommodate user folders
            date = os.path.getctime(path)
            ext = os.path.splitext(file)[1]
            if ext == '.png':
                if db.session.query(Cap.path).filter_by(path=path).scalar() is None:
                    db.session.add(Cap(date, path, user_id))
                    db.session.commit()


class CapSchema(Schema):
    '''Use marshmallow to enable serialization of Cap query'''
    date = fields.Int()
    path = fields.Str()
    user_id = fields.Int()


@bottlecapp.route('/gallery', methods=('GET', 'POST'))
@flask_login.login_required
def gallery():
    # Add cap to database if it has not already been added
    Cap.add()
    current_user = User.query.get(flask_login.current_user.get_id())
    thumbnails = current_user.caps.all()
    schema = CapSchema(many=True)
    thumbnails_json = schema.dumps(thumbnails)
    caps = Markup(thumbnails_json.data) # safer than {{ caps|tojson }} at keeping format as json while passing from jinja to js
    return render_template('grid.html', caps=caps, users=User.query.all())


@bottlecapp.route('/upload')
@flask_login.login_required
def upload():
    return render_template('upload.html')


@bottlecapp.route('/uploaded', methods=('GET', 'POST'))
@flask_login.login_required
def uploaded():
    '''If uploaded cap file's extension is allowed, save to user folder.'''
    if request.method == 'POST':
        # Get the uploaded files as a list
        uploaded_files = request.files.getlist('uploads')
        filenames = []
        for file in uploaded_files:
            # Check if the file's extension is allowed
            if file and Cap.allowed_ext(file.filename):
                # Make the filename safe, remove unsupported chars
                filename = secure_filename(file.filename)
                # Save the filename into a list to be used later
                filenames.append(filename)
                # Allow user to crop, rotate, and compress file
                return render_template('upload.html')
            else:
                flash('Incorrect file type. Please upload only pngs.')
                return redirect(url_for('upload'))
        return redirect(url_for('upload'))
# Save the file to the user folder
# file.save(os.path.join(bottlecapp.config['UPLOAD_FOLDER'] + flask_login.current_user.username, filename))

if __name__ == '__main__':
    db.create_all()
    bottlecapp.run(debug=True)





