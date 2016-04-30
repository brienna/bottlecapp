from flask import Flask, render_template, Markup, flash, redirect, url_for, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from marshmallow import Schema, fields
from flask_wtf import Form
from wtforms import StringField
from wtforms.validators import DataRequired
import os
from werkzeug import secure_filename
import flask.ext.login as flask_login

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
app.config['SECRET_KEY'] = 'important to keep unknown in production' # for form
app.config['UPLOAD_FOLDER'] = 'static/caps/'
app.config['ALLOWED_EXTENSIONS'] = set(['png'])
db = SQLAlchemy(app)  # creates db instance and binds it to the app
# set up the login manager by instantiating it and telling it about our Flask app
login_manager = flask_login.LoginManager()
login_manager.init_app(app)


class User(db.Model):
    __tablename__ = 'user'

    id = db.Column(db.Integer, primary_key=True)
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
        """True, as all users are active."""
        return True

    def get_id(self):
        """Return the id to satisfy Flask-Login's requirements."""
        return self.id

    def is_authenticated(self):
        """Return True if the user is authenticated."""
        return self.authenticated

    def is_anonymous(self):
        """False, as anonymous users aren't supported."""
        return False

    def get_username(self):
    	return self.username


@login_manager.user_loader
def load_user(id):
	print('user loader:', User.query.get(id))
	return User.query.get(id)


@app.route("/", methods=["GET", "POST"])
def login():
    """For GET requests, display the login form. For POSTS, login the current user
    by processing the form."""
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
            	return redirect(url_for("gallery"))
            else:
            	flash('incorrect password')
        else:
        	print('new user')
        	flash('New user')
    else:
    	flash('Please log in.')
    button = 'Log in'
    return render_template("login.html", form=form, users=users, button=button)


@app.route("/logout", methods=["GET"])
@flask_login.login_required
def logout():
    """Logout the current user."""
    user = flask_login.current_user
    user.authenticated = False
    db.session.add(user)
    db.session.commit()
    flask_login.logout_user()
    return redirect(url_for('login'))


@app.route('/signup', methods=["GET", "POST"])
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
			newpath = app.config['UPLOAD_FOLDER'] + username
			if not os.path.exists(newpath):
				os.makedirs(newpath)
			return redirect(url_for('login'))
		else:
			flash('Existing user. Please choose a different name or log in')
	return render_template('login.html', form=form, users=users, button=button)


class LoginForm(Form):
    """A class definition for the login form object.

    Attributes:
        username (object)
        password (object)
    """
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
		"""For a given file, return whether or not it's an allowed type."""
		return filename.rsplit('.')[1] in app.config['ALLOWED_EXTENSIONS']

	def add():
		"""Add cap filepath to database if its filepath is not already in database"""
		username = flask_login.current_user.get_username()
		user_id = flask_login.current_user.get_id()
		caps_dir = app.config['UPLOAD_FOLDER'] + username + '/'
		for file in os.listdir(caps_dir):
			print('file:', file)
			path = caps_dir + os.path.relpath(file)  # note: use relpath to later accommodate user folders
			date = os.path.getctime(path)
			ext = os.path.splitext(file)[1]
			if ext == '.jpg' or ext == '.jpeg' or ext == '.png':
				print('yes')
				if db.session.query(Cap.path).filter_by(path=path).scalar() is None:
					db.session.add(Cap(date, path, user_id))
					db.session.commit()


class CapSchema(Schema):
	'''Use marshmallow to enable serialization of Cap query'''
	date = fields.Int()
	path = fields.Str()
	user_id = fields.Int()


@app.route('/gallery', methods=('GET', 'POST'))
def gallery():
	Cap.add() # if not already in database
	current_user = User.query.get(flask_login.current_user.get_id())
	thumbnails = current_user.caps.all()
	schema = CapSchema(many=True)
	thumbnails_json = schema.dumps(thumbnails)
	caps = Markup(thumbnails_json.data) # safer than {{ caps|tojson }} at keeping format as json while passing from jinja to js
	users = User.query.all()
	return render_template('grid.html', caps=caps, users=users)


@app.route('/upload')
def upload():
	return render_template('upload.html')


@app.route('/uploaded', methods=('GET', 'POST'))
def uploaded():
	username = flask_login.current_user.get_username()
	if request.method == 'POST':
		cap = request.files['file']
		if cap and Cap.allowed_ext(cap.filename):
			cap_secure = secure_filename(cap.filename)
			cap.save(os.path.join(app.config['UPLOAD_FOLDER'] + username, cap_secure))
			return redirect(url_for('gallery'))
		else:
			flash('Incorrect file type. Please use png.')
			return redirect(url_for('upload'))


if __name__ == '__main__':
	db.create_all()
	app.run(debug=True)





