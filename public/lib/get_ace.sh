
mv ace ace-old

git clone https://github.com/ajaxorg/ace-builds.git
cd ace-builds
git checkout gh-pages
cd ..
mv ace-builds/src-min-noconflict ace
rm -rf ace-builds
