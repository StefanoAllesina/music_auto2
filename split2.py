import sys
import os
from PyPDF2 import PdfFileReader, PdfFileWriter
import subprocess

# Function that converts a page from pdf to jpg
def convert_page(filename):
    #print("converting to jpg file " + ff + "...", end = "\r")
    subprocess.call(["convert", "-density", "300", filename, filename[:-4] + ".jpg"])
    # remove the pdf as we don't need it anymore
    subprocess.call(["rm", filename])
    return 0

# Main function of this file
def split_and_convert(filename, outputfolder, debug = False):
    reader = PdfFileReader(stream=os.path.abspath(filename))
    for i in range(0, reader.numPages):
        page = reader.pages[i]
        if debug:
            print('Converting page: ' + str(i))
        writer = PdfFileWriter()
        writer.addPage(page)
        outputPath = os.path.abspath(outputfolder)
        outputFile = outputPath + '/' + str(i) + '.pdf'
        f = open(file=outputFile, mode='wb')
        writer.write(f)
        f.close()
        convert_page(outputFile)

if __name__ == '__main__':
    cl_arguments = sys.argv
    if len(cl_arguments) < 2:
        raise ValueError("not enough arguments")
    else:
        filename = cl_arguments[1]
        outputfolder = cl_arguments[2]
        split_and_convert(filename=filename, outputfolder=outputfolder)
        print("Finished splitting the file!")



