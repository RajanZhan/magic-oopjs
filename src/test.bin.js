"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _initializerDefineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/initializerDefineProperty"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _applyDecoratedDescriptor2 = _interopRequireDefault(require("@babel/runtime/helpers/applyDecoratedDescriptor"));

var _initializerWarningHelper2 = _interopRequireDefault(require("@babel/runtime/helpers/initializerWarningHelper"));

var _main = require("./main");

var _dec, _dec2, _class, _descriptor, _descriptor2, _temp, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _class3, _class4, _descriptor3, _descriptor4, _temp2;

var Base = (_dec = (0, _main.Schema)({
  username: _main.Joi.string().min(3).max(30).required()
}), _dec2 = (0, _main.Schema)(_main.Joi.string().min(3)), (_class = (_temp =
/*#__PURE__*/
function () {
  function Base() {
    (0, _classCallCheck2["default"])(this, Base);
    (0, _initializerDefineProperty2["default"])(this, "userInfo", _descriptor, this);
    (0, _initializerDefineProperty2["default"])(this, "name", _descriptor2, this);
  }

  (0, _createClass2["default"])(Base, [{
    key: "main",
    value: function main() {
      return _regenerator["default"].async(function main$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              console.log("父类统一的main方法"); //this.setter(this.userInfo,12) ;
              //this.userInfo = 12;

              this.setter.userInfo = {
                username: "1D2"
              }; // console.log(this.userInfo)

              return _context.abrupt("return", 1000);

            case 3:
            case "end":
              return _context.stop();
          }
        }
      }, null, this);
    } // 父类的被继承的方法
    // @Abstract
    // @Public
    // @Params({
    // 	username: Joi.string().min(3).max(30).required(),
    // })
    // @Returns({ username: Joi.string().min(3).max(30).required(), })
    // async cc() {
    // }

  }, {
    key: "run",
    value: function run() {
      console.log("父类的run");
    }
  }, {
    key: "getName",
    value: function getName() {
      return "父类的方法 getName";
    }
  }]);
  return Base;
}(), _temp), (_descriptor = (0, _applyDecoratedDescriptor2["default"])(_class.prototype, "userInfo", [_main.Public, _main.Final, _dec], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), (0, _applyDecoratedDescriptor2["default"])(_class.prototype, "main", [_main.Public, _main.Final], Object.getOwnPropertyDescriptor(_class.prototype, "main"), _class.prototype), (0, _applyDecoratedDescriptor2["default"])(_class.prototype, "run", [_main.Protected], Object.getOwnPropertyDescriptor(_class.prototype, "run"), _class.prototype), (0, _applyDecoratedDescriptor2["default"])(_class.prototype, "getName", [_main.Public], Object.getOwnPropertyDescriptor(_class.prototype, "getName"), _class.prototype), _descriptor2 = (0, _applyDecoratedDescriptor2["default"])(_class.prototype, "name", [_main.Public, _dec2], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return "";
  }
})), _class));
var Cat = (_dec3 = (0, _main.Extends)(Base), _dec4 = (0, _main.Params)({
  username: _main.Joi.string().min(3).max(30).required()
}), _dec5 = (0, _main.Params)([{
  username: _main.Joi.string().min(3).max(30).required()
}]), _dec6 = (0, _main.Returns)([{
  username: _main.Joi.string().min(3).max(30).required()
}, _main.Any]), _dec7 = (0, _main.Schema)(_main.Joi.object({
  name: _main.Joi.string().max(5).required(),
  list: _main.Joi.array().items({
    age: _main.Joi.number().min(5).required()
  }).required()
})), _dec8 = (0, _main.Params)([_main.Joi.string().max(4).required()]), _dec9 = (0, _main.Returns)([_main.Joi.string().max(4).required()]), _dec3(_class3 = (_class4 = (_temp2 =
/*#__PURE__*/
function () {
  function Cat() {
    (0, _classCallCheck2["default"])(this, Cat);
    (0, _initializerDefineProperty2["default"])(this, "age", _descriptor3, this);
    (0, _initializerDefineProperty2["default"])(this, "dataList", _descriptor4, this);
  }

  (0, _createClass2["default"])(Cat, [{
    key: "run",
    value: function run() {
      this["super"].run(); //console.log("
      // 子类的run");
    }
  }, {
    key: "cc",
    value: function cc(params) {
      return _regenerator["default"].async(function cc$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              return _context2.abrupt("return", [{
                username: "123"
              }, {
                username: "00"
              }]);

            case 1:
            case "end":
              return _context2.stop();
          }
        }
      });
    } //@Protected
    //@Readonly
    //name = "";
    //@Validate()

  }, {
    key: "schemeCheck",
    value: function schemeCheck() {
      return _regenerator["default"].async(function schemeCheck$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              // this.setter.dataList = {
              // 	name: "122",
              // 	list: [{ age: 10 }]
              // }
              // return {
              // 	name: "122",
              // 	list: [{ age: 10 }]
              // }
              this.setter.dataList = {
                name: "0",
                list: [{
                  age: 10
                }]
              };
              console.log("schemeCheck");

            case 2:
            case "end":
              return _context3.stop();
          }
        }
      }, null, this);
    }
  }, {
    key: "schameSimple",
    value: function schameSimple(data) {
      return _regenerator["default"].async(function schameSimple$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              console.log("simpleSchame");
              this.setter.name = "01111";
              return _context4.abrupt("return", ['11']);

            case 3:
            case "end":
              return _context4.stop();
          }
        }
      }, null, this);
    }
  }]);
  return Cat;
}(), _temp2), ((0, _applyDecoratedDescriptor2["default"])(_class4.prototype, "run", [_dec4, _main.Public], Object.getOwnPropertyDescriptor(_class4.prototype, "run"), _class4.prototype), (0, _applyDecoratedDescriptor2["default"])(_class4.prototype, "cc", [_main.Public, _dec5, _dec6], Object.getOwnPropertyDescriptor(_class4.prototype, "cc"), _class4.prototype), _descriptor3 = (0, _applyDecoratedDescriptor2["default"])(_class4.prototype, "age", [_main.Public], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return 12;
  }
}), _descriptor4 = (0, _applyDecoratedDescriptor2["default"])(_class4.prototype, "dataList", [_dec7], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: function initializer() {
    return null;
  }
}), (0, _applyDecoratedDescriptor2["default"])(_class4.prototype, "schemeCheck", [_main.Public], Object.getOwnPropertyDescriptor(_class4.prototype, "schemeCheck"), _class4.prototype), (0, _applyDecoratedDescriptor2["default"])(_class4.prototype, "schameSimple", [_dec8, _dec9], Object.getOwnPropertyDescriptor(_class4.prototype, "schameSimple"), _class4.prototype)), _class4)) || _class3); //console.log(c['cc'],'ccccccc');
//cat.dataList  = ()=>{}
// let string = cat.getName({ name: 1 });
//string = cat.getAge({name:1});
//cat.name = "";
//cat.getName = ()=>{}
//console.log(cat.name);
// console.log("子类的a",cat.a);
// console.log("父类的a",cat.getA());
//cat.cc();
//cat.call("getName",{})
// console.log("结果是",string);
// cat.main()
//console.log(cat.main);

(function () {
  var cat = (0, _main.Factory)(Cat, {
    username: "112"
  }); // cat.dataList = {
  // 	name: "0",
  // 	list: [{ age: 10 }]
  // }
  // cat.schemeCheck()

  cat.schameSimple(["22"]); //await cat.cc([{ username: "1111" }]);
  // 	let c = new Cat()
  //cat.c = ()=>{}
  // let resulr = await cat.main({ username: "ccc" });
  // cat.userInfo = {username:"52d"};
  // console.log(cat.userInfo)
  //   cat.getcc = ()=>{
  //   }
  //console.log("外部读取的结果", resulr);
  // let schame = Joi.object().keys({
  // 	a: Joi.string().required().max(3),
  // 	result: Joi.array().items({ name: Joi.string().required().min(3), age: Joi.number().min(10).max(60).required() }).required()
  // });
  // const { error } = schame.validate({ a: "21", result: [{ name: "1", age: 18 }] })
  //console.log(error)
})();
