from flask import Flask, render_template, Markup, redirect, url_for, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from marshmallow import Schema, fields
from flask_wtf import Form
from wtforms import StringField
from wtforms.validators import DataRequired
import os
from werkzeug import secure_filename


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
app.config['SECRET_KEY'] = 'important to keep unknown in production' # for form
app.config['UPLOAD_FOLDER'] = 'static/caps'
app.config['ALLOWED_EXTENSIONS'] = set(['png'])
db = SQLAlchemy(app)  # creates db instance and binds it to the app


class Login(Form):
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
	
	def __init__(self, date, path):
		self.date = date
		self.path = path

	def __repr__(self):
		return '<Cap {0}, {1}>'.format(self.date, self.path)

	def allowed_ext(filename):
		"""For a given file, return whether or not it's an allowed type."""
		return filename.rsplit('.')[1] in app.config['ALLOWED_EXTENSIONS']

	def add():
		"""Add cap filepath to database if its filepath is not already in database"""
		caps_dir = 'static/caps/'
		for file in os.listdir(caps_dir):  
			path = caps_dir + os.path.relpath(file)  # note: use relpath to later accommodate user folders
			date = os.path.getctime(path)
			ext = os.path.splitext(file)[1]
			if ext == '.jpg' or ext == '.jpeg' or ext == '.png':  
				if db.session.query(Cap.path).filter_by(path=path).scalar() is None:
					db.session.add(Cap(date, path))
					db.session.commit()


class CapSchema(Schema):
	'''Use marshmallow to enable serialization of Cap query'''
	date = fields.Int()
	path = fields.Str()


@app.route('/', methods=('GET', 'POST'))
def login():
	form = Login()
	return render_template('login.html', form=form)


@app.route('/gallery', methods=('GET', 'POST'))
def index():
	Cap.add() # if not already in database
	thumbnails = Cap.query.order_by('id DESC').all()
	schema = CapSchema(many=True)
	thumbnails_json = schema.dumps(thumbnails)
	caps = Markup(thumbnails_json.data)  # safer than {{ caps|tojson }} at keeping format as json while passing from jinja to js
	return render_template('grid.html', caps=caps)


@app.route('/upload')
def upload():
	return render_template('upload.html')


@app.route('/uploaded', methods=('GET', 'POST'))
def uploaded():
	if request.method == 'POST':
		cap = request.files['file']
		if Cap.allowed_ext(cap.filename):
			cap_secure = secure_filename(cap.filename)
			cap.save(os.path.join(app.config['UPLOAD_FOLDER'], cap_secure))
			return redirect(url_for('index'))


if __name__ == '__main__':
	db.create_all()
	app.run(debug=True)





