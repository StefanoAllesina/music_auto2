import matplotlib
matplotlib.use('TkAgg')
import sys
import os
import csv
import numpy as np
from PyPDF2 import PdfFileReader, PdfFileWriter
from pathlib import Path
import cv2
import subprocess


# Function that converts a page from pdf to jpg
def convert_page(ff):
    #print("converting to jpg file " + ff + "...", end = "\r")
    subprocess.call(["convert", "-density", "300", ff, ff[:-4] + ".jpg"])
    # remove the pdf as we don't need it anymore
    subprocess.call(["rm", ff])
    return 0

# Main function of this file

#replaced filename with path_to_pdf

def split_and_convert(path_to_pdf, output_folder, debug = False):
    reader = PdfFileReader(stream=os.path.abspath(path_to_pdf))
    for i in range(0, reader.numPages):
        page = reader.pages[i]
        if debug:
            print('Converting page: ' + str(i))
        writer = PdfFileWriter()
        writer.addPage(page)
        outputPath = os.path.abspath(output_folder)
        outputFile = outputPath + '/' + str(i) + '.pdf'
        f = open(file=outputFile, mode='wb')
        writer.write(f)
        f.close()
        convert_page(outputFile)

    return reader.numPages

#rotates pages using HoughLines
def rotate_page(output_folder, showImage = False):
    jpg_page_num = 0
    while True:
        #searches for path_to_jpg_folder/0.jpg
        jpg_path = output_folder + str(jpg_page_num) + ".jpg"
        


        if Path(jpg_path).is_file():
            original = cv2.imread(jpg_path,1)
            height = original.shape[0]
            width = original.shape[1]

            maxlength = 1000
            if height > maxlength or width > maxlength:
                maxL = max(height, width)
                scale = maxL/maxlength
                img= cv2.resize(original, (int(height//scale), int(width//scale)))
            else:
                img = original

            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 100, 150, apertureSize = 3)

            minimumLineLength = int(img.shape[1]//2.5)
            lines = cv2.HoughLines(edges,1, np.pi/180, int(img.shape[1]/2.5))

          
            sumTheta = 0
            count = 0

            #find average of theta
            for line in lines:
                theta = line[0][1]

                #ignore lines greater than 100 or less than 80 degrees
                #the angle is measured from the positive y axis going clockwise
                #horizontal lines are 90 degrees, but this is all in radians.  
                if theta < 1.74533 and theta > 1.39626:
                    sumTheta = sumTheta + theta
                    count = count + 1

            avg = sumTheta/count

            #to show where the lines are drawn in red. 
            if showImage:
                for line in lines:
                    rho = line[0][0]
                    theta = line[0][1]
                    if theta < 1.74533 and theta > 1.39626:

                        #code below gotten from cv2 tutorial
                        a = np.cos(theta)
                        b = np.sin(theta)
                        x0 = a*rho
                        y0 = b*rho

                        x1 = int(x0 + 1000 * -b)
                        y1 = int(y0 + 1000 * a)
                        x2 = int(x0 - 1000 * -b)
                        y2 = int(y0 - 1000 *a)

                        cv2.line(img, (x1,y1),(x2,y2),(0,0,255),2)
                cv2.imshow('Lines Found', img)
                cv2.waitKey(0)


            center = (width/2, height/2) #(width/2, height/2)

            degrees = avg*180 / np.pi #convert rad to deg
            angleCorrect = degrees - 90 #angle it needs to rotate top left by 

            rotated = cv2.getRotationMatrix2D(center, angleCorrect,1)
            rotated = cv2.warpAffine(original, rotated, (width, height))
            if showImage:
                cv2.imshow('Rotated Image', rotated)
                cv2.waitKey(0)

            cv2.imwrite(jpg_path, original)
            jpg_page_num = jpg_page_num + 1
        else:
            break

#This is  for when the script is imported
def mainFunction(path_to_pdf, output_folder): 
    '''
    arg[0] = pdf that is multiple pages long
    arg[1] = folder that you want to place it in
    '''
    numPages = split_and_convert(filename=path_to_pdf, outputfolder=output_folder, debug=True)
    print("Finished splitting the file!")
    return numPages    

if __name__ == '__main__':
    cl_arguments = sys.argv
    if len(cl_arguments) < 3:
        raise ValueError("not enough arguments")
    else:
        path_to_pdf = cl_arguments[1]
        output_folder = cl_arguments[2]
        split_and_convert(path_to_pdf, output_folder, debug=True)
        print("Finished splitting the file!")
        rotate_page(output_folder,showImage = False)

