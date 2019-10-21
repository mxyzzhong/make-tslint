# make tslint

Add tslint with rules of ant-design for my project.  

make-tslint will download [rules](https://raw.githubusercontent.com/ant-design/antd-tools/master/lib/tslint.json) from ant-design by default, you can also set your own tslint json.  

After downloading the tslint json, it will install packages defined on the field of extends in `tslint.json` automatically.

### Installing

`npm install -g make-tslint`

### Get Started

`make-tslint`

> `make-tslint` will create a script `lint` in `package-json` and it can lint the code in the src folder. You can modify the lint path if you need.
