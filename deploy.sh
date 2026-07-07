#!/bin/bash
git checkout gh-pages || git checkout -b gh-pages
git rm -rf .
cp -r dist/* .
git add -A
git commit -m "Deploy"
git push origin gh-pages --force
git checkout main
