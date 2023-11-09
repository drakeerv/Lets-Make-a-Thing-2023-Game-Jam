# zip up all files in the current directory except block list

import os
import zipfile

ONLINE = True
if ONLINE:
    import requests
    import minify_html
    import rcssmin
else:
    import rjsmin

def minimize_js(js: bytes) -> bytes:
    # toptal is unbeatable at minifying js
    if ONLINE:
        return requests.post("https://www.toptal.com/developers/javascript-minifier/api/raw", data={"input": js.decode()}).text.encode()
    return rjsmin.jsmin(js)

def minimize_css(css: bytes) -> bytes:
    # toptal is pretty much the same as rcssmin so we'll use that to save requests
    return rcssmin.cssmin(css)

def minimize_html(html: bytes) -> bytes:
    # for some reason toptal sucks at minifying html
    return minify_html.minify(html.decode(), minify_css=True,
                              minify_js=True, remove_bangs=True, keep_html_and_head_opening_tags=True, do_not_minify_doctype=True).encode()

MINIFY = {
    ".js": minimize_js,
    ".css": minimize_css,
    ".html": minimize_html
}

BLOCKLIST = [
    "package.py",
    "build.zip",
    "sources",
    "build",
    "assets/filter/frag.glsl",
    "assets/filter/vert.glsl",
    ".git",
    ".gitattributes",
    ".gitignore",
    "README.md",
    "LICENSE"
]

BUILD_FILE = "build/build.zip"


def zipdir(path: str, ziph: zipfile.ZipFile):
    for file in os.listdir(path):
        file = os.path.normpath(os.path.join(path, file)).replace("\\", "/")

        if file in BLOCKLIST:
            print("Skipping " + file)
            continue

        print("Adding " + file)
        if os.path.isdir(file):
            zipdir(file, ziph)
        else:
            if file.lower().endswith(tuple(MINIFY.keys())):
                with open(file, "rb") as f:
                    ziph.writestr(file,
                                  MINIFY[os.path.splitext(file.lower())[1]](f.read()))
            else:
                ziph.write(file)

def getSizeOfDir(path: str):
    size = 0
    for path, _, files in os.walk(path):
        for f in files:
            fp = os.path.join(path, f)
            size += os.path.getsize(fp)
    return size


if __name__ == "__main__":
    if not os.path.exists("build"):
        os.mkdir("build")

    zipf = zipfile.ZipFile(BUILD_FILE, "w",
                           zipfile.ZIP_DEFLATED, True, 9)
    zipdir("./", zipf)
    zipf.close()

    print("=" * 20)
    print("Build complete")
    print("Build size zipped: " + str(round(os.path.getsize(BUILD_FILE) / 1000000, 3)) + " mb")
    print("Project size: " + str(round(getSizeOfDir(".") / 1000000, 3)) + " mb")