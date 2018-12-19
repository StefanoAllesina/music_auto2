import sys
import os
import shutil
import csv

#imported python scripts
import find_lines_original
import split

#checks the extension, and calls split.py
#returns the number of pages as well
def convertToPDF(file, folder):
	ext = os.path.splitext(file)[-1].lower() #extension of file given


	#if pdf, split up pages, convert to jpgs
	if ext == '.pdf':
		return split.mainFunction(file, folder)

if __name__ == "__main__":
	#read in file name
	# lines = [sys.argv[1],sys.argv[2]] #use this when running from the terminal

	lines = sys.stdin.readlines() #use this when you're calling from app.js
	print(f'from python: {lines}')
	lines = lines[0].split()

	###########################
	path = './public/'
	uploadPath = './public/original/' #where file is originally uploaded
	fileName = lines[0] #name of the file ie 'file.pdf'
	projectName = lines[1]
	fileFolder = path + projectName #make folder ./public/fileName.ext/
	#make new folder for this file
	os.mkdir(fileFolder) #make folder ./public/fileName.ext/
	fileFolder = fileFolder + '/'
	file = fileFolder +"original.pdf" #full path
	############################


	#move uploaded image into this folder. Renames image to 'original.pdf'
	shutil.move(uploadPath + fileName, file)


	#converts images to pdf, breaks up the pages, calls script.py
	#will put them in ./public/fileName.ext/separatePages/
	sepPageFolder = fileFolder + 'separatePages'
	os.mkdir(sepPageFolder)
	#number of pages
	numPages = convertToPDF(file, sepPageFolder)
	order_of_pages = sepPageFolder + "/order_of_pages.csv"


	if numPages ==1:
		shutil.move(file, sepPageFolder + '/' + lines)


	#goes through each page, and calls find_lines_original
	boxFolder = fileFolder + 'boxes'
	os.mkdir(boxFolder)
	order_of_pages = sepPageFolder + "/order_of_pages.csv"

	with open(order_of_pages) as csvfile:
		reader = csv.reader(csvfile)
		csv_lines = list(reader)
		for i in csv_lines:
			print(i)
			# find_lines_original.find_staves(sepPageFolder + '/' + i[1], i[0], boxFolder + '/boxes' + i[0] + '.csv')
			find_lines_original.find_staves(sepPageFolder + '/' + i[1], i[0], boxFolder + '/boxes.csv')









