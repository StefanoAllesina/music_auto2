## making it into pdf
#16:9 aspect ratio landscape

import os
import sys
import glob
import cv2
import numpy as np
import csv


#combines into one page. 
#Note: we assume that the user is reading the second from the top line
#So for the first page: the top line is empty.
#For the last page: Only the top and second to the top line are there. 
def combine_images_into_one_page(image_parameters, queue_of_line_images):
    verticalSpace = image_parameters["verticalSpace"]
    leftSpace = image_parameters["leftSpace"]
    channels = image_parameters["channels"]
    page_image = np.ones((image_parameters["totalHeight"], image_parameters["totalWidth"], 
        image_parameters["channels"]), np.uint8) *255

    for i in range(number_lines_per_page):
        if i < len(queue_of_line_images):
            line_image = queue_of_line_images[i]
            height, width = line_image.shape[:2]
            page_image[(verticalSpace*(i+1) - height):verticalSpace*(i+1), leftSpace:width+leftSpace, :channels] = queue_of_line_images[i]
    return page_image

#Images must have the same number of channels (1 for BW or 3 for Color)
def attach_images_horizontally(img0, img1):
    height0 = img0.shape[0]
    height1 = img1.shape[0]
    width0 = img0.shape[1]
    width1 = img1.shape[1]
    totalWidth = width0 + width1
    channels = img0.shape[2]

    #make blank white image big enough to attach two images horizontally
    combined_images = np.ones((max(height0, height1), totalWidth, channels), np.uint8) *255
    combined_images[:height0, :width0, :channels] = img0
    combined_images[:height1, width0:totalWidth, :channels] = img1
    return combined_images

def getPartialImage(box_data, path_to_jpgs):
    x = box_data["x"]
    y = box_data["y"]
    width = box_data["w"]
    height = box_data["h"]
    page_num = box_data["page"]

    path_to_jpg_page = path_to_jpgs + str(page_num) + ".jpg"
    img = cv2.imread(path_to_jpg_page)
    img = img[y:(y + height), x:(x + width), :]
    return img

def compile_flow(path_to_csv, path_to_jpgs, output_path_to_final_pdf, number_lines_per_page):

    boxes_data = []
    maxHeight = 0
    maxWidth = 0

    string_of_all_jpg_paths = "" #string of final page jpf paths. 
    #This is for converting the images to 1 pdf

    with open(path_to_csv) as f:
        # csvr = csv.reader(f)
        csvr = csv.DictReader(f)
        for r in csvr:
            d = {
            "x": int(float(r["x"])),
            "y": int(float(r["y"])),
            "w": int(float(r["w"])),
            "h": int(float(r["h"])),
            "page": int(float(r["page"]))
            }

            boxes_data.append(d)

            maxHeight = max(maxHeight, d["h"])
            maxWidth = max(maxWidth, d["w"])

    #calculate image parameters
    ###############################################################
    #give a minimum buffer of %5 vertical white space between each box.
    #Note that there would be 4 white spaces vertically in total for 3 boxes
    #So it would be dumb if (num_lines_per_page + 1)* verticalSpaceBuffer > 1
    verticalSpaceBuffer = .05
    #give a buffer of 10% white space on the left
    leftSpaceBuffer = .1

    #for example, if there are 3 lines per page: maxHeight is the maximum height of all the lines. 
    #So to be conservative, the total height is 3 * maxHeight. However, we want white space between each box vertically for ease of reading.
    # If there are three boxes, there will 3 + 1 white spaces vertically added between each box. (top space, space between 1st line and 2nd line, space between 2nd and 3rd line, and space at bottom )
    totalHeight = int(maxHeight * number_lines_per_page /(1 - verticalSpaceBuffer*(number_lines_per_page+ 1)))
    totalWidth = int(maxWidth/(1 - leftSpaceBuffer))


    #the width:height ratio is 16:9
    if totalWidth/totalHeight > 16/9:
        #it's too wide, and needs to be taller to get 16:9 ratio
        totalHeight = int(totalWidth/16*9)
        
    else:
        #it's too tall, and needs to be made wider to get 16:9 ratio
        totalWidth = int(totalHeight/9 *16)

    #how much vertical space is allocated for box + white space buffer in total
    verticalSpace = int(totalHeight * verticalSpaceBuffer + maxHeight)
    leftSpace = int(leftSpaceBuffer * totalWidth)
    tempImg = cv2.imread(path_to_jpgs + "0.jpg")
    channels = tempImg.shape[2]

    image_parameters = {"verticalSpaceBuffer": verticalSpaceBuffer, "leftSpaceBuffer": leftSpaceBuffer, "maxHeight": maxHeight, "maxWidth":maxWidth, "totalHeight": totalHeight, 'totalWidth': totalWidth, "verticalSpace": verticalSpace, "leftSpace":leftSpace, "number_lines_per_page": number_lines_per_page, "channels": channels}

    ###########################################################

    ### edge case: 1st page
    #It's possible that the the top and middle line are short and can be concatenated into one line
    #after the first page, the top and middle line have been used before in previous pages and are set. 
    #This code lets you concatenates a bunch of small boxes together


    queue_of_line_images = list()
    counter_boxes = 0
    for i in range(number_lines_per_page): 
        line = getPartialImage(boxes_data[i], path_to_jpgs)
        queue_of_line_images.append(line)
        counter_boxes = counter_boxes + 1

    while counter_boxes < len(boxes_data) -2:
        concatenate = False
        for i in range(number_lines_per_page -1):                
            if queue_of_line_images[i].shape[1] + queue_of_line_images[i+1].shape[1] < maxWidth:
                img = attach_images_horizontally(queue_of_line_images[i], queue_of_line_images[i+1])
                queue_of_line_images[i] = img
                queue_of_line_images.pop(i+1)
                newLine = getPartialImage(boxes_data[counter_boxes], path_to_jpgs)
                queue_of_line_images.append(newLine)
                counter_boxes += 1
                concatenate = True
        if not concatenate:
            break

    firstPage = combine_images_into_one_page(image_parameters, queue_of_line_images)

    string_of_all_jpg_paths = string_of_all_jpg_paths + output_path_to_final_pdf + "final0.jpg "
    cv2.imwrite(output_path_to_final_pdf + "final0.jpg", firstPage)


    pdf_page_num = 1 #it starts at 0
    ###########################################################
    #all the other pages except for the first page
    #for the second page and onward, the top line and middle line can't change, because
    #they were used in previous pages and are set.
    #however, if the bottom line is short, it can possibly become longer.
    #Again, this code currently allows an unlimited number of boxes to be attached horizontally.
    #it would be a lot simplier if only two could be attached. 
    while counter_boxes < len(boxes_data):
        for i in range(number_lines_per_page -1):
            queue_of_line_images.pop(0) #removes the top line

        #the below checks the next line. If that line and the current bottom line are small enough, they will be concatenated. 


        # currently, you can concatenate as many boxes horizontally together, as long as they're small. This would be good if there are 3 randomly small boxes right next to each other. 
        # if you want to limit it to at most 2 lines can be concatenated horizontally, replace the below 'while' with an 'if' 
        for i in range(number_lines_per_page - 1):
            if counter_boxes >= len(boxes_data): 
                break
            bottom_image = getPartialImage(boxes_data[counter_boxes], path_to_jpgs)
            counter_boxes += 1
            while counter_boxes < len(boxes_data):
                width_next_box = boxes_data[counter_boxes]["w"]

                if bottom_image.shape[1] + width_next_box < maxWidth:
                    img2 = getPartialImage(boxes_data[counter_boxes], path_to_jpgs)
               
                    bottom_image = attach_images_horizontally(bottom_image, img2)
     
                    counter_boxes += 1
                else:
                    break

            queue_of_line_images.append(bottom_image)
        page_image = combine_images_into_one_page(image_parameters, queue_of_line_images)

        string_of_all_jpg_paths = string_of_all_jpg_paths + output_path_to_final_pdf + "final" + str(pdf_page_num) +".jpg "
        cv2.imwrite(output_path_to_final_pdf + "final"+str(pdf_page_num)+".jpg", page_image)

        pdf_page_num += 1
    ###########################################################

    #edge case - the last few pages
    #It keeps on popping off line images, until there are only two left.
    #the last page will only have two lines
    # while len(queue_of_line_images) > 2:
    #     queue_of_line_images.pop(0)
    #     page_image = combine_images_into_one_page(image_parameters, queue_of_line_images)
    #     string_of_all_jpg_paths = string_of_all_jpg_paths + output_path_to_final_pdf + "final" + str(pdf_page_num) +".jpg "
    #     cv2.imwrite(output_path_to_final_pdf + "final"+str(pdf_page_num)+".jpg", page_image)
    #     pdf_page_num += 1



    print(string_of_all_jpg_paths)
    #gets all the page images and makes them into one big happy pdf
    os.system("convert " + string_of_all_jpg_paths + " " + output_path_to_final_pdf +"pdf_out.pdf")
    string_of_all_jpg_paths = string_of_all_jpg_paths.split()

    #deletes all those jpgs
    for i in string_of_all_jpg_paths:
        os.remove(i)



if __name__ == '__main__':
    cl_arguments = sys.argv

    path_to_csv = cl_arguments[1]
    path_to_jpgs = cl_arguments[2]
    output_path_to_final_pdf = cl_arguments[3]
    number_lines_per_page = int(cl_arguments[4])   
    # print(path_to_csv)    

    compile_flow(path_to_csv, path_to_jpgs, output_path_to_final_pdf, number_lines_per_page)
    print("Finished compiling!")