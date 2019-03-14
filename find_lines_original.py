import cv2
import csv
import sys
import numpy as np
import json
from pathlib import Path


# def find_staves(page, pagenum, csv_name):
def find_staves(jpg_path, jpg_page_num, box_data, box_id):
    original = cv2.imread(jpg_path)


    height = original.shape[0]
    width = original.shape[1]
    par_threshold = 128
    horizontal_scale = 20
    # proportional to 100000 on a 4200 x 3200 image
    min_area = height * width / 134
    # proportional to 700000 on a 4200 x 3200 image
    max_area = height * width / 19
    # proportional to 70 on a 4200 x 3200 image
    min_height = height / 60

    horizontal = cv2.cvtColor(original,cv2.COLOR_BGR2GRAY)
    (thresh, horizontal) = cv2.threshold(horizontal, par_threshold, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    horizontal = cv2.adaptiveThreshold(cv2.bitwise_not(horizontal), 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 15, -2)
    horizontalsize = int(width / horizontal_scale) 
    horizontalStructure = cv2.getStructuringElement(cv2.MORPH_RECT, (horizontalsize,1))
    horizontal = cv2.erode(horizontal, horizontalStructure, (-1, 1))
    horizontal = cv2.dilate(horizontal, horizontalStructure, (-1, 1))
    kernel = np.ones((40,40), np.uint8)
    horizontal = cv2.dilate(horizontal, kernel, iterations = 1)
    horizontal = cv2.bitwise_not(horizontal)

    image, contours, hier = cv2.findContours(horizontal, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    contours.reverse()
    line_number = 0
    for i, c in enumerate(contours):
        x, y, w, h = cv2.boundingRect(c)
        my_area = w * h
        if (my_area < max_area) and (my_area > min_area) and (h > min_height):
            vert_buffer = h * 0.35
            h += vert_buffer*2
            y -= vert_buffer if y>=vert_buffer else 0
            # boxID page line x y w h
            line_number += 1
            data = {"boxID": box_id, "page": jpg_page_num, "line": line_number, "x" : x, "y": y, "w": w, "h": h}
            box_id += 1
            box_data.append(data)

    return box_id

if __name__ == '__main__':
    cl_arguments = sys.argv
    if len(cl_arguments) < 3:
        raise ValueError("not enough arguments")
    
    path_to_jpg_folder = cl_arguments[1]
    output_path_to_json = cl_arguments[2]

    jpg_page_num = 0
    box_id = 0
    box_data = []

    while True:
        #searches for path_to_jpg_folder/0.jpg
        jpg_path = path_to_jpg_folder + str(jpg_page_num) + ".jpg"

        if Path(jpg_path).is_file():
            box_id = find_staves(jpg_path, jpg_page_num, box_data, box_id)
        else:
            break

        
        jpg_page_num += 1

    output = output_path_to_json + "/data.json"
    with open(output, 'w') as outfile:  
        json.dump(box_data, outfile)


