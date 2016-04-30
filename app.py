from flask import Flask, render_template, Markup, flash, redirect, url_for, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from marshmallow import Schema, fields
from flask_wtf import Form
from wtforms import StringField
from wtforms.validators import DataRequired
import os
from werkzeug import secure_filename
import flask.ext.login as flask_login

# Initialize the Flask application and set configurations
bottlecapp = Flask(__name__)
bottlecapp.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
bottlecapp.config['SECRET_KEY'] = 'important to keep unknown in production' # for form
bottlecapp.config['UPLOAD_FOLDER'] = 'static/caps/'
bottlecapp.config['ALLOWED_EXTENSIONS'] = set(['png'])

# create db instance and bind it to the app
db = SQLAlchemy(bottlecapp)  

# set up the login manager by instantiating it and telling it about the app
login_manager = flask_login.LoginManager()
login_manager.init_app(bottlecapp)


class User(db.Model):
	'''A class definition for a user object.
	'''
	id = db.Column(db.Integer, primary_key=True)
	# User authentication information
	username = db.Column(db.String)
	password = db.Column(db.String)
	authenticated = db.Column(db.Boolean, default=False)

	# define one to many relationship with child table
	caps = db.relationship('Cap', backref='user', lazy='dynamic')

	def __init__(self, username, password):
		self.username = username
		self.password = password

	def __repr__(self):
		return '<User {0}, {1}>'.format(self.username, self.password)

	def is_active(self):
		'''True, as all users are active.'''
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
            if user.password == form.password.data:
            	print('user exists')
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
    else:
    	flash('Please log in.')
    button = 'Log in'
    return render_template('login.html', form=form, users=users, button=button)


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


@bottlecapp.route('/signup', methods=['GET', 'POST'])
def signup():
	form = LoginForm()
	users = User.query.all()
	button = 'Sign up'
	if form.validate_on_submit():
		user = User.query.filter_by(username=form.username.data).first()
		if user is None:
			# create new user
			username = form.username.data
			password = form.password.data
			db.session.add(User(username, password))
			db.session.commit()
			# create new user folder
			newpath = bottlecapp.config['UPLOAD_FOLDER'] + username
			if not os.path.exists(newpath):
				os.makedirs(newpath)
			return redirect(url_for('login'))
		else:
			flash('Existing user. Please choose a different name or log in')
	return render_template('login.html', form=form, users=users, button=button)


class LoginForm(Form):
    '''A class definition for the login form object.

    Attributes:
        username (object)
        password (object)
    '''
    username = StringField('username:', validators=[DataRequired()])
    password = StringField('password:', validators=[DataRequired()])


class Cap(db.Model):
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
		cap = request.files['file']
		if cap and Cap.allowed_ext(cap.filename):
			cap_secure = secure_filename(cap.filename)
			username = flask_login.current_user.username
			cap.save(os.path.join(bottlecapp.config['UPLOAD_FOLDER'] + username, cap_secure))
			return redirect(url_for('gallery'))
		else:
			flash('Incorrect file type. Please use png.')
			return redirect(url_for('upload'))


if __name__ == '__main__':
	db.create_all()
	bottlecapp.run(debug=True)





