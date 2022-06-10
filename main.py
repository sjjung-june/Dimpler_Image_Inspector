from flask import Flask, render_template, request
import numpy as np
from scipy.signal import find_peaks
from skimage import draw
from werkzeug.utils import secure_filename
import cv2
import os

UPLOAD_FOLDER = "./static/images"
app = Flask("Dimpler Inspector")
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.get('/')
def home():
    return render_template("index.html")

@app.route('/upload', methods = ['POST'])
def uploader():
   if request.method == 'POST':
       f = request.files['file']
       filename = secure_filename(f.filename)
       file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
       f.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
       return filename
  
@app.route("/profile", methods = ['POST'])
def plot_profile():    
    if request.method == 'POST':
        img = request.get_json()["img"]
        start = request.get_json()["start_pos"]
        end = request.get_json()["end_pos"]
        dist = request.get_json()["dist"]
        smooth = request.get_json()["smooth"]
        img_name = img.split('/')[-1]
        image_url = f'{UPLOAD_FOLDER}/{img_name}'        
        
        image = cv2.imread(rf'{image_url}', cv2.IMREAD_GRAYSCALE)
        image_copy = image.copy()
        image_copy = cv2.GaussianBlur(image_copy,(smooth,smooth),cv2.BORDER_DEFAULT)        
        line = np.transpose(np.array(draw.line(start[0],start[1],end[0],end[1])))
        data = image_copy.copy()[line[:, 1], line[:, 0]]
        peaks, _ =  find_peaks(data*-1, distance=dist)        
        return {"profile_x": np.arange(0,len(data)).tolist(), "profile_y":data.tolist(), "peak_x":peaks.tolist(), "peak_y":data[peaks].tolist()}

@app.route("/profile/delete", methods=['POST'])
def remove_peak():
    if request.method == 'POST':        
        profile_x = request.get_json()["profile_x"]
        profile_y = request.get_json()["profile_y"]
        peak_x = request.get_json()["peak_x"]
        peak_y = request.get_json()["peak_y"]
        peak = request.get_json()["peak"]
        idx = peak_x.index(peak)
        peak_x.pop(idx)
        peak_y.pop(idx)
        
        return {"profile_x":profile_x, "profile_y":profile_y, "peak_x":peak_x, "peak_y":peak_y}

@app.route("/profile/add", methods=['POST'])
def add_peak():
    if request.method == 'POST':        
        profile_x = request.get_json()["profile_x"]
        profile_y = request.get_json()["profile_y"]
        peak_x = request.get_json()["peak_x"]
        peak_y = request.get_json()["peak_y"]
        new_peak_x = request.get_json()["new_peak_x"]
        new_peak_y = request.get_json()["new_peak_y"]
        
        peak_x.append(new_peak_x)
        peak_y.append(new_peak_y)
        
        return {"profile_x":profile_x, "profile_y":profile_y, "peak_x":peak_x, "peak_y":peak_y}
    
app.run(host="10.138.126.181")