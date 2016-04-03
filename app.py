from flask import Flask, render_template  	# import Flask class, render_template method

app = Flask(__name__)  						# create instance of the Flask class

@app.route('/')								# route 
def grid():									# view
	return render_template('grid.html')		

if __name__ == '__main__':  				# execute only if file run directly
	app.run(debug=True)  					# note: turn off debug mode before deploying