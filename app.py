from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
db = SQLAlchemy(app)  # creates db instance and binds it to the app

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

def addCaps():
	"""Add cap from folder if filepath does not exist in database"""
	import os
	caps_dir = 'static/caps/'  
	for file in os.listdir(caps_dir):  
		path = caps_dir + os.path.relpath(file)  # note: use relpath to later accommodate user folders
		date = os.path.getctime(path)
		ext = os.path.splitext(file)[1]
		if ext == '.jpg' or ext == '.jpeg' or ext == '.png':  
			if (db.session.query(Cap.path).filter_by(path=path).scalar() is None):
				db.session.add(Cap(date, path))
				db.session.commit()

@app.route('/')
def grid():
	addCaps()
	thumbnails = Cap.query.order_by('id DESC').all()
	return render_template('grid.html', thumbnails=thumbnails)

if __name__ == '__main__':
	db.create_all()
	app.run(debug=True)





