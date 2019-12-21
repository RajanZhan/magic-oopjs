import { Factory, Private, Joi, Protected, Public, Readonly, Schema, Final, Extends, Abstract, Params, Returns, Any } from "./main"


class Base {


	// @Params({ username: Joi.string().min(3).max(30).required() })
	// Base() {
	// 	console.log("父类构造方法");
	// }

	@Public
	// @Readonly
	@Final
	@Schema({ username: Joi.string().min(3).max(30).required() })
	userInfo = null;

	@Public
	@Final
	async main() {
		console.log("父类统一的main方法");
		//this.setter(this.userInfo,12) ;
		//this.userInfo = 12;
		this.setter.userInfo = { username: "1D2" };
		// console.log(this.userInfo)
		return 1000;
	}

	// 父类的被继承的方法
	// @Abstract
	// @Public
	// @Params({
	// 	username: Joi.string().min(3).max(30).required(),
	// })
	// @Returns({ username: Joi.string().min(3).max(30).required(), })
	// async cc() {
	// }


	@Protected
	run() {
		console.log("父类的run");
	}

	@Public
	getName() {
		return "父类的方法 getName"
	}


	@Public
	@Schema(Joi.string().min(3))
	name = ""
}



@Extends(Base)
class Cat {

	@Params({ username: Joi.string().min(3).max(30).required() })
	// Cat() {

	// 	this.super.constructor({ username: "jsjsjsj" });
	// 	console.log("执行构造方法");
	// 	//return "jajaj"
	// }

	@Public
	run() {
		this.super.run();
		//console.log("
		// 子类的run");
	}

	@Public
	//@Public
	//@Private
	@Params([
		{
			username: Joi.string().min(3).max(30).required(),
		}
	])
	@Returns([{ username: Joi.string().min(3).max(30).required() }, Any])
	async cc(params) {
		return [{ username: "123", }, { username: "00", }];
	}

	//@Protected
	//@Readonly
	//name = "";

	//@Validate()
	@Public
	age = 12;
	// __call_before()
	// {
	// 	console.log("__call_before");
	// 	return true;
	// }

	// __call_stop()
	// {
	// 	console.log("调用被拦截");
	// }


	@Schema(Joi.object({
		name: Joi.string().max(5).required(),
		list: Joi.array().items({
			age: Joi.number().min(5).required()
		}).required()
	}))
	dataList = null;



	
	


	@Public
	async schemeCheck() {
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
			list: [{ age: 10 }]
		}
		console.log("schemeCheck");
	}


	@Params([Joi.string().max(4).required(),])
	@Returns([Joi.string().max(4).required()])
	async schameSimple(data) {
		console.log("simpleSchame");
		this.setter.name = "01111"
		return ['11']
	}
}


//console.log(c['cc'],'ccccccc');



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

(() => {
	let cat = Factory(Cat, { username: "112" });
	// cat.dataList = {
	// 	name: "0",
	// 	list: [{ age: 10 }]
	// }
	// cat.schemeCheck()
	
	cat.schameSimple(["22"]);

	//await cat.cc([{ username: "1111" }]);
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

})()

