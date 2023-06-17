import hashlib
import os
import fnmatch
from lxml import etree

DIRECTORY = "./demo_order"
BUNDLE_SIZE = 50

# Helper function to hash a text using SHA-3


def hash_sha3(text):
    return hashlib.sha3_256(text.encode('utf-8')).hexdigest()

# Recursive function to traverse the XML tree and hash each field


def traverse_and_hash(node, parent_tag=None):
    hash_dict = {}
    for child in node:
        if len(child) > 0:
            child_hash_dict = traverse_and_hash(child, parent_tag=child.tag)
            hash_dict.update(child_hash_dict)
        else:
            hashed_value = hash_sha3(child.text)
            key = f"{parent_tag}-{child.tag}" if parent_tag else child.tag
            hash_dict[key] = hashed_value

    return hash_dict


# Function to process an XML file


def process_xml_file(file_path):
    with open(file_path, 'rb') as f:  # Read the file as bytes
        xml_data = f.read()

    root = etree.fromstring(xml_data)
    xml_hash_dict = traverse_and_hash(root)
    # Concatenate the hashes in the xml_hash_dict
    concatenated_hashes = ''.join(xml_hash_dict.values())

    # Compute the overarching hash
    overarching_hash = hash_sha3(concatenated_hashes)

    return overarching_hash

# Function to process XML files in a directory and its subdirectories


def process_xml_files_in_directory(directory):
    hashes = {}
    for root, dirs, files in os.walk(directory):
        for file in fnmatch.filter(files, '*.xml'):
            file_path = os.path.join(root, file)

            process_xml_hash = process_xml_file(file_path)
            hashes[file_path] = process_xml_hash
    print(hashes)
    return hashes


# Start processing XML files in the directory and its subdirectories


def main():
    hash_per_file = process_xml_files_in_directory(DIRECTORY)
    hashes = list(hash_per_file.values())
    length = BUNDLE_SIZE
    concat_hash = ""

    if len(hashes) < BUNDLE_SIZE:
        length = len(hashes)

    for i in range(length):
        concat_hash += hashes[i]

    overreaching_hash = hash_sha3(concat_hash)
    print(overreaching_hash)
    return overreaching_hash


if __name__ == "__main__":
    main()
