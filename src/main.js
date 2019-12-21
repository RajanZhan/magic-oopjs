const { getDataType, objectDeepCompare } = require("./utils/function");
const { isFunction, validate, isAsyncFunction, isArray, isObject } = getDataType();
const Joi = require('@hapi/joi');
var errorMsg = "";
//判断两个对象是否相等
function _deepCompare(x, y) {
    var i, l, leftChain, rightChain;

    function compare2Objects(x, y) {
        var p;

        // remember that NaN === NaN returns false
        // and isNaN(undefined) returns true
        if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
            return true;
        }

        // Compare primitives and functions.     
        // Check if both arguments link to the same object.
        // Especially useful on the step where we compare prototypes
        if (x === y) {
            return true;
        }

        // Works in case when functions are created in constructor.
        // Comparing dates is a common scenario. Another built-ins?
        // We can even handle functions passed across iframes
        if ((typeof x === 'function' && typeof y === 'function') ||
            (x instanceof Date && y instanceof Date) ||
            (x instanceof RegExp && y instanceof RegExp) ||
            (x instanceof String && y instanceof String) ||
            (x instanceof Number && y instanceof Number)) {
            return x.toString() === y.toString();
        }

        // At last checking prototypes as good as we can
        if (!(x instanceof Object && y instanceof Object)) {
            return false;
        }

        if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
            return false;
        }

        if (x.constructor !== y.constructor) {
            return false;
        }

        if (x.prototype !== y.prototype) {
            return false;
        }

        // Check for infinitive linking loops
        if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
            return false;
        }

        // Quick checking of one object being a subset of another.
        // todo: cache the structure of arguments[0] for performance
        for (p in y) {
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false;
            } else if (typeof y[p] !== typeof x[p]) {
                return false;
            }
        }

        for (p in x) {
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false;
            } else if (typeof y[p] !== typeof x[p]) {
                return false;
            }

            switch (typeof (x[p])) {
                case 'object':
                case 'function':

                    leftChain.push(x);
                    rightChain.push(y);

                    if (!compare2Objects(x[p], y[p])) {
                        return false;
                    }

                    leftChain.pop();
                    rightChain.pop();
                    break;

                default:
                    if (x[p] !== y[p]) {
                        return false;
                    }
                    break;
            }
        }

        return true;
    }

    if (arguments.length < 1) {
        return true; //Die silently? Don't know how to handle such case, please help...
        // throw "Need two or more arguments to compare";
    }

    for (i = 1, l = arguments.length; i < l; i++) {

        leftChain = []; //Todo: this can be cached
        rightChain = [];

        if (!compare2Objects(arguments[0], arguments[i])) {
            return false;
        }
    }

    return true;
}

// 检测对象内的$inner 属性， 该属性为保留属性
function _inner_checkinner(target) {
    if (target && !target.$inner) {
        target.$inner = {
            //$limit:new Map(),// 属性的限制数据格式
            $methodsValidate: {
                $returns: new Map(),
                $params: new Map(),
                $desc: new Map(),
            },
            $className: null,// 类名
            $constructor: null,// 构造方法,
            $isHandleConstructor: false,// 标致是否执行了构造方法 ，如果未定义构造方法，则这里将不会为true
            $parentObj: null,// 父类对象
        }
    }

    if (target && !target.super) {
        target.super = {}
    }

    if (target && !target.$parentInner) {
        target.$parentInner = {}
    }

    // 提供对外访问内部属性的方法
    target.$getInner = () => {
        return target.$inner;
    }

    // 提供对外访问内部属性的方法
    target.$getParentInner = () => {
        return target.$parentInner;
    }

    // 提供对外访问内部属性的方法
    target.$setHandleConstructor = () => {
        target.$inner.$isHandleConstructor = true;
    }

    // 设置父类的对外构造方法
    target.$setParentsConstuctor = (fun) => {
        target.super['constructor'] = fun;
    }

    // 读取父类对象
    target.$getParentObj = () => {
        return target.$inner.$parentObj;
    }
}

// 检测类内的$inner 属性， 该属性为保留属性
function _inner_checkClssinner(target) {
    if (target && target.prototype && !target.prototype.$inner) {
        target.prototype.$inner = {}
    }

    if (target && target.prototype && !target.prototype.super) {
        target.prototype.super = {}
    }

    if (target && target.prototype && !target.prototype.$parentInner) {
        target.prototype.$parentInner = {}
    }
}


// 检测对象内的保留属性或方法 返回false 说明 不是内部保留属性，可用业务
/**
 * $inner 存放内部装饰修饰的一系列数据
 * $parentInner 针对继承， 存放上一级父类的的保留数据
 * super 针对继承， 存放上一级父类的在子类中也定义的属性或者方法
 */
function _inner_checkinner_keywords(attr) {
    if (!attr) {
        return false;
    }
    let inner_attr = new Set(["$inner", "$parentInner", "super", 'constructor', "getter", "setter"]);
    return inner_attr.has(attr);
}

// 兼容读取schame
function _inner_get_schame(paramsSchema) {
    if(!paramsSchema)
    {
        return null;
    }
    let schema = null;
    if (paramsSchema.validate && isFunction(paramsSchema.validate)) {
        schema = paramsSchema;
    }
    else {
        schema = Joi.object(paramsSchema);
    }
    if (schema == null) {
        throw new Error(`schame 校验对象构建失败`);
    }
    return schema
}

// schame 异常信息读取
function _inner_joi_error(error) {
    if (!error) {
        return;
    }
    let err = "";
    if (error.details && error.details.length >= 0) {
        for (let e of error.details) {
            if (!e) {
                continue;
            }
            err += e.message + "、"
        }
    }
    return err;
}

// 检测传入的params的合法性 callType 为Params 或者 Returns 表示数据检测的类型时 调用检测还是 返回结果检测
function _inner_check_params(paramsSchema, params, className, key, callType = "Params") {
    if (paramsSchema) {

        // if (!isArray(params) && !isObject(params)) {
        //     console.log(params)
        //     errorMsg = `Factory getter 异常:类${className}的${key}方法调用时，${callType} 参数校验异常,异常信息：${callType}参数要求是数组或者对象`
        //     throw new Error(errorMsg);
        // }

        // 这里处理params 不是对象情况 
        if (!isObject(params) && !isArray(params)) {
            if (paramsSchema && paramsSchema.validate) {
                let { error } = paramsSchema.validate(params);
                if (error) {
                    let err = _inner_joi_error(error);
                    //let err = validateResult &&  validateResult.error && validateResult.error.ValidationError?validateResult.error.ValidationError:""
                    errorMsg = `Factory getter 异常:类${className}的${key}方法调用时，${callType} 参数校验异常,异常信息：${err}`
                    throw new Error(errorMsg);
                }
                return;
            }
        }

        if (isArray(params) && !isArray(paramsSchema)) {
            errorMsg = `Factory getter 异常:类${className}的${key}方法调用时，${callType} 参数校验异常,异常信息：${callType}参数要求是数组，但实际调用时传入的参数不是数组`
            throw new Error(errorMsg);
        }
        if (isArray(paramsSchema) && !isArray(params)) {
            errorMsg = `Factory getter 异常:类${className}的${key}方法调用时，${callType} 参数校验异常,异常信息：${callType}参数要求是数组，但实际调用时传入的参数不是数组`
            throw new Error(errorMsg);
        }

        if (isArray(params)) {
            if (params.length != paramsSchema.length) {
                errorMsg = `Factory getter 异常:类${className}的${key}方法调用时，${callType} 参数校验异常,异常信息：${callType}参数要求是数组，但实际调用时传入的数据长度不一致`
                throw new Error(errorMsg);
            }

            for (let i = 0; i < params.length; i++) {

                if (!params[i] || !paramsSchema[i]) {
                    errorMsg = `Factory getter 异常:类${className}的${key}方法调用时，${callType} 参数校验异常,异常信息：${callType}参数数组的第${i}个参数和传进来的参数有一个为null或者undefined`
                    throw new Error(errorMsg);
                }

                if (paramsSchema[i].toString() == Any.toString()) {
                    continue;
                }

                // 这里处理params 不是对象情况 
                if (!isObject(params[i])) {

                    if (paramsSchema[i] && paramsSchema[i].validate && isFunction(paramsSchema[i].validate)) {

                        // console.log(paramsSchema[i].validate, params[i], '4444');
                        let { error } = paramsSchema[i].validate(params[i]);
                        if (error) {
                            let err = _inner_joi_error(error);
                            errorMsg = `Factory getter 异常:类${className}的${key}方法调用时，${callType} 参数数组第${i}参数，校验异常，异常信息：${err}`
                            throw new Error(errorMsg);
                        }
                        continue;
                    }

                }

                if (!isObject(paramsSchema[i]) && paramsSchema[i] != null) {
                    errorMsg = `Factory getter 异常:类${className}的${key}方法调用时，${callType} 参数校验异常,异常信息：${callType}参数数组的第${i}个参数必须要求为一个合法对象，但实际的值为${paramsSchema[i]}`
                    throw new Error(errorMsg);
                }
                if (!isObject(params[i])) {
                    errorMsg = `Factory getter 异常:类${className}的${key}方法调用时，${callType} 参数校验异常,异常信息：传入参数数组的第${i}个元素必须要求为一个合法对象，但实际的值为${params[i]}`
                    throw new Error(errorMsg);
                }
                let schema = _inner_get_schame(paramsSchema[i]);
                if (schema == null) {
                    errorMsg = `Factory getter 异常:类${className}的${key}方法调用时，${callType} 参数校验异常,异常信息：schame 校验对象构建失败`
                    throw new Error(errorMsg);
                }
                let { error } = schema.validate(params[i]);
                if (error) {

                    let err = _inner_joi_error(error);
                    errorMsg = `Factory getter 异常:类${className}的${key}方法调用时，${callType} 参数数组第${i}参数，校验异常，异常信息：${err}`
                    throw new Error(errorMsg);
                }
            }
        }
        else {
            if (paramsSchema.toString() == Any.toString()) {
                return;
            }
            let schema = _inner_get_schame(paramsSchema);
            if (schema == null) {
                errorMsg = `Factory getter 异常:类${className}的${key}方法调用时，${callType} 参数校验异常,异常信息：schame 校验对象构建失败`
                throw new Error(errorMsg);
            }
            //console.log("pramas 检测 ", isArray(params), params);
            let { error } = schema.validate(params);
            if (error) {
                //console.log(error.details)

                let err = _inner_joi_error(error);
                //let err = validateResult &&  validateResult.error && validateResult.error.ValidationError?validateResult.error.ValidationError:""
                errorMsg = `Factory getter 异常:类${className}的${key}方法调用时，${callType} 参数校验异常,异常信息：${err}`
                throw new Error(errorMsg);
            }
        }

    }
}



// 内部控制代理
function _inner_proxy(o, className) {
    var errorMsg = "";
    return new Proxy(o, {
        get(target, key, receiver) {
            _inner_checkinner(target);
            if (_inner_checkinner_keywords(key)) {
                errorMsg = `Factory getter 异常:类${className}的${key}属性或者方法 为内部保留方法/属性，不可直接访问`
                throw new Error(errorMsg);
            }
            //console.log(o[key],key)
            if ((o[key] === undefined) || (o[key] === "undefined")) {

                errorMsg = `Factory getter 异常:类${className}的${key}属性或者方法 可能不存在`
                throw new Error(errorMsg);
            }


            // 访问权限控制
            if (isFunction(o[key])) {


                if (target.$inner.PrivateMethods) {
                    if (target.$inner.PrivateMethods.has(key)) {
                        errorMsg = `Factory getter 异常:类${className}的${key}为私有方法，不可外部访问`
                        throw new Error(errorMsg);
                    }
                }
                if (target.$inner.ProtectedMethods) {
                    if (target.$inner.ProtectedMethods.has(key)) {
                        errorMsg = `Factory getter 异常:类${className}的${key}为保护方法，不可外部访问`
                        throw new Error(errorMsg);
                    }
                }

                //判断是异步函数还是同步
                // let isAsync = isAsyncFunction(async ()=>{})
                // console.log("检测",isAsync);
                return (params) => {
                    //let args = Array.prototype.slice.call(arguments);

                    if (o['__call_before']) {
                        if (!o['__call_before'](key, params)) {
                            if (o["__call_stop"]) {
                                o["__call_stop"](key, params)
                            }
                            return;
                        }
                    }

                    //检测传入的parmas是否是正确的 
                    if (target.$inner.$methodsValidate.$params.has(key)) {
                        let paramsSchema = target.$inner.$methodsValidate.$params.get(key);
                        _inner_check_params(paramsSchema, params, className, key);
                    }

                    // 检测方法返回的结果
                    function checkReturns(key, value) {
                        let paramsSchema = target.$inner.$methodsValidate.$returns.get(key);
                        _inner_check_params(paramsSchema, value, className, key, "Returns")

                    }

                    // 检测是否是异步方法
                    if (o[key].toString().indexOf("_regenerator[\"default\"].async") != -1) {

                        return o[key].call(o, params).then((result) => {

                            //console.log("异步函数调用结果 是 ", result);
                            // 检测调用的结果
                            if (result === null || result === false) {
                                return result
                            }
                            checkReturns(key, result)
                            return result;
                        })
                    }
                    else {

                        //console.log("同步函数调用");
                        let result = o[key].call(o, params)
                        if (result === null || result === false) {
                            return result
                        }
                        if (result instanceof Promise) // 说明返回的结果是一个Promise 对象
                        {
                            return result.then(res => {
                                if (res === null || res === false) {
                                    return res
                                }
                                checkReturns(key, res)
                                return res;
                            })
                        }
                        else {
                            checkReturns(key, result)
                            return result;
                        }
                    }


                };
            }
            else {

                if (target.$inner.PrivateAttr) {
                    if (target.$inner.PrivateAttr.has(key)) {
                        errorMsg = `Factory getter 异常:类${className}的${key}为私有属性，不可外部访问`
                        throw new Error(errorMsg);
                    }
                }
                if (target.$inner.ProtectedAttr) {
                    if (target.$inner.ProtectedAttr.has(key)) {
                        errorMsg = `Factory getter 异常:类${className}的${key}为保护属性，不可外部访问`
                        throw new Error(errorMsg);
                    }
                }
                return o[key]
            }

        },
        set(target, key, value) {

            //console.log("哈哈哈",key)
            _inner_checkinner(target);
            if (_inner_checkinner_keywords(key)) {
                errorMsg = `Factory setter 异常:类${className}的${key}属性或者方法 为内部保留方法/属性，不可直接访问`
                throw new Error(errorMsg);
            }

            if (isFunction(value)) {
                errorMsg = `Factory setter 异常:无法在外部为类${className}的对象新增${key}方法，方法只能类中定义`
                throw new Error(errorMsg);
            }

            if (!isFunction(value) && isFunction(o[key])) {
                errorMsg = `Factory setter 异常:类${className}的 ${key} 为方法，无法赋值为一个非函数/方法的值`
                throw new Error(errorMsg);
            }

            if (isFunction(o[key])) {
                // 检测是否是readonly
                errorMsg = `Factory setter 异常:类${className}的${key}方法保护，不可随意改动对象的方法`
                throw new Error(errorMsg);
                // o[key] = value;
                // return true;
            }
            else //如何是数值的情况
            {


                if ((target.$inner.PrivateAttr && target.$inner.PrivateAttr.has(key)) || (target.$inner.ReadonlyAttr && target.$inner.ReadonlyAttr.has(key)) || (target.$parentInner && target.$parentInner && target.$parentInner.$inner && target.$parentInner.$inner.ReadonlyAttr && target.$parentInner.$inner.ReadonlyAttr.has(key))) {
                    errorMsg = `Factory setter 异常:类${className}的${key}属性为只读或者私有属性，无法赋值`
                    throw new Error(errorMsg);
                }

                //console.log("检测schama",target.$parentInner.$inner,key);
                //检测数据类型是和定义的数据类型一致
                //let schame = target.$inner.AttrLimit.get(key);
                if ((target.$inner.AttrLimit && target.$inner.AttrLimit.get(key)) || (target.$parentInner && target.$parentInner.$inner && target.$parentInner.$inner.AttrLimit && target.$parentInner.$inner.AttrLimit.get(key))) {

                    let schemaRule = null;
                    if (target.$inner.AttrLimit.get(key)) {
                        schemaRule = target.$inner.AttrLimit.get(key);
                       // console.log("@@@",schemaRule);
                    }
                    else if (target.$parentInner.$inner.AttrLimit.get(key)) {
                        schemaRule = target.$parentInner.$inner.AttrLimit.get(key);
                    }
                    else {
                        return;
                    }
                   
                    let schema = _inner_get_schame(schemaRule);
                    if (!schema) {
                        //console.log(key,target.$parentInner.$inner.AttrLimit.get(key),"rule");

                        errorMsg = `Factory setter 异常:类${className}的 ${key} 属性赋值时，schame校验对象读取失败`
                        throw new Error(errorMsg);
                    }
                    let { error } = schema.validate(value);
                    if (error) {
                        let err = "";
                        if (error.details && error.details.length >= 0) {
                            for (let e of error.details) {
                                if (!e) {
                                    continue;
                                }
                                err += e.message + "、"
                            }
                        }
                        //let err = validateResult &&  validateResult.error && validateResult.error.ValidationError?validateResult.error.ValidationError:""
                        errorMsg = `Factory setter 异常:类${className}的 ${key} 属性无法赋值，因为数据类型不匹配,异常信息：${err}`
                        throw new Error(errorMsg);
                    }
                }

                o[key] = value;
                return true;
            }

        }
    });
}

// 外部控制代理
function _setter(target, key, value, className, o) {

    _inner_checkinner(target);
    if (_inner_checkinner_keywords(key)) {
        errorMsg = `Factory setter 异常:类${className}的${key}属性或者方法 为内部保留方法/属性，不可直接访问`
        throw new Error(errorMsg);
    }
    // if (isFunction(value) && !isFunction(o[key])) {
    //     errorMsg = `Factory setter 异常:类${className}的 ${key} 为属性，无法赋值为一个函数/方法`
    //     throw new Error(errorMsg);
    // }
    if (isFunction(value)) {
        errorMsg = `Factory setter 异常:无法在外部为类${className}的对象新增${key}方法，方法只能类中定义`
        throw new Error(errorMsg);
    }

    if (!isFunction(value) && isFunction(o[key])) {
        errorMsg = `Factory setter 异常:类${className}的 ${key} 为方法，无法赋值为一个非函数/方法的值`
        throw new Error(errorMsg);
    }

    if (isFunction(o[key])) {
        // 检测是否是readonly
        // if (target.$inner.ReadonlyMethods && target.$inner.ReadonlyMethods.has(key)) {
        //     errorMsg = `Factory setter 异常:类${className}的${key}方法为只读方法，无法赋值`
        //     throw new Error(errorMsg);
        // }
        errorMsg = `Factory setter 异常:类${className}的${key}方法保护，不可随意改动对象的方法`
        throw new Error(errorMsg);
        // o[key] = value;
        // return true;
    }
    else //改属性值
    {
        //console.log(target.$parentInner)
        if ((target.$inner.ReadonlyAttr && target.$inner.ReadonlyAttr.has(key)) || (target.$parentInner && target.$parentInner && target.$parentInner.$inner && target.$parentInner.$inner.ReadonlyAttr && target.$parentInner.$inner.ReadonlyAttr.has(key))) {
            errorMsg = `Factory setter 异常:类${className}的${key}属性为只读属性，无法赋值`
            throw new Error(errorMsg);
        }

        //console.log("检测schama",target.$parentInner.$inner,key);
        //检测数据类型是和定义的数据类型一致
        //let schame = target.$inner.AttrLimit.get(key);
        if ((target.$inner.AttrLimit && target.$inner.AttrLimit.get(key)) || (target.$parentInner && target.$parentInner.$inner && target.$parentInner.$inner.AttrLimit && target.$parentInner.$inner.AttrLimit.get(key))) {
            let schemaRule = null;
            if (target.$inner.AttrLimit.get(key)) {
                schemaRule = target.$inner.AttrLimit.get(key);
            }
            else if (target.$parentInner.$inner.AttrLimit.get(key)) {
                schemaRule = target.$parentInner.$inner.AttrLimit.get(key);
            }
            else {
                return;
            }
            let schema = _inner_get_schame(schemaRule);
            if (!schema) {
                errorMsg = `Factory setter 异常:类${className}的 ${key} 属性赋值时，构造校验schame失败`
                throw new Error(errorMsg);
            }
            let { error } = schema.validate(value);
            if (error) {
                let err = "";
                if (error.details && error.details.length >= 0) {
                    for (let e of error.details) {
                        if (!e) {
                            continue;
                        }
                        err += e.message + "、"
                    }
                }
                //let err = validateResult &&  validateResult.error && validateResult.error.ValidationError?validateResult.error.ValidationError:""
                errorMsg = `Factory setter 异常:类${className}的 ${key} 属性无法赋值，因为数据类型不匹配,异常信息：${err}`
                throw new Error(errorMsg);
            }
        }

        o[key] = value;
        return true;
    }


}

function _outer_proxy(o, className) {
    var errorMsg = "";
    return new Proxy(o, {
        get(target, key, receiver) {
            _inner_checkinner(target);
            if (_inner_checkinner_keywords(key)) {
                errorMsg = `Factory getter 异常:类${className}的${key}属性或者方法 为内部保留方法/属性，不可直接访问`
                throw new Error(errorMsg);
            }
            if ((o[key] === undefined) || (o[key] === "undefined")) {
                console.log(o[key])
                errorMsg = `Factory getter 异常:类${className}的${key}属性或者方法 可能不存在`
                throw new Error(errorMsg);
            }

            // 访问权限控制
            if (isFunction(o[key])) {
                if (target.$inner.PrivateMethods) {
                    if (target.$inner.PrivateMethods.has(key)) {
                        errorMsg = `Factory getter 异常:类${className}的${key}为私有方法，不可外部访问`
                        throw new Error(errorMsg);
                    }
                }
                if (target.$inner.ProtectedMethods) {
                    if (target.$inner.ProtectedMethods.has(key)) {
                        errorMsg = `Factory getter 异常:类${className}的${key}为保护方法，不可外部访问`
                        throw new Error(errorMsg);
                    }
                }

                //判断是异步函数还是同步
                // let isAsync = isAsyncFunction(async ()=>{})
                // console.log("检测",isAsync);
                return (params) => {
                    if (o['__call_before']) {
                        if (!o['__call_before'](key, params)) {
                            if (o["__call_stop"]) {
                                o["__call_stop"](key, params)
                            }
                            return;
                        }
                    }

                    //检测传入的parmas是否是正确的 
                    if (target.$inner.$methodsValidate.$params.has(key)) {
                        let schema = Joi.object(target.$inner.$methodsValidate.$params.get(key));
                        let { error } = schema.validate(params);
                        if (error) {
                            //console.log(error.details)
                            let err = "";
                            if (error.details && error.details.length >= 0) {
                                for (let e of error.details) {
                                    if (!e) {
                                        continue;
                                    }
                                    err += e.message + "、"
                                }
                            }
                            //let err = validateResult &&  validateResult.error && validateResult.error.ValidationError?validateResult.error.ValidationError:""
                            errorMsg = `Factory getter 异常:类${className}的${key}方法调用时，Params 参数校验异常,异常信息：${err}`
                            throw new Error(errorMsg);
                        }

                    }

                    // 检测方法返回的结果
                    function checkReturns(key, value) {
                        if (target.$inner.$methodsValidate.$returns.has(key)) {
                            let schema = Joi.object(target.$inner.$methodsValidate.$returns.get(key));
                            let { error } = schema.validate(value);
                            if (error) {
                                let err = "";
                                if (error.details && error.details.length >= 0) {
                                    for (let e of error.details) {
                                        if (!e) {
                                            continue;
                                        }
                                        err += e.message + "、"
                                    }
                                }
                                //let err = validateResult &&  validateResult.error && validateResult.error.ValidationError?validateResult.error.ValidationError:""
                                errorMsg = `Factory getter 异常:类${className}的${key}方法调用时，Returns 参数校验异常,异常信息：${err}`
                                throw new Error(errorMsg);
                            }

                        }
                    }

                    if (o[key].toString().indexOf("_regenerator[\"default\"].async") != -1) {

                        return o[key].call(o, params).then((result) => {

                            //console.log("异步函数调用结果 是 ", result);
                            // 检测调用的结果
                            if (result === null || result === false) {
                                return result
                            }
                            checkReturns(key, result)
                            return result;
                        })
                    }
                    else {

                        //console.log("同步函数调用");
                        let result = o[key].call(o, params)
                        if (result === null || result === false) {
                            return result
                        }

                        checkReturns(key, result)
                        return result;
                    }


                };
            }
            else {
                if (target.$inner.PrivateAttr) {
                    if (target.$inner.PrivateAttr.has(key)) {
                        errorMsg = `Factory getter 异常:类${className}的${key}为私有属性，不可外部访问`
                        throw new Error(errorMsg);
                    }
                }
                if (target.$inner.ProtectedAttr) {
                    if (target.$inner.ProtectedAttr.has(key)) {
                        errorMsg = `Factory getter 异常:类${className}的${key}为保护属性，不可外部访问`
                        throw new Error(errorMsg);
                    }
                }
                return o[key]
            }

        },
        set(target, key, value) {
            return _setter(target, key, value, className, o)
        }
    });
}




// 主工厂方法，用于创建对象
function Factory(clas, constructorParams) {
    //console.log(clas.prototype.geto,"hahah111");
    let className = "";
    var errorMsg = "";
    if (!clas || !clas.prototype || !clas.prototype.constructor || !clas.prototype.constructor.name) {
        errorMsg = `Factory异常:构造对象失败，因为传入了一个不合法的类`
        throw new Error(errorMsg);
    }
    className = clas.prototype.constructor.name;
    let o = new clas();

    let innerAttr = {};
    for (let i in o) {
        if (!i) {
            continue
        }
        innerAttr[i] = o[i];
    }
    o.setter = new Proxy(o, {
        set(target, key, value) {
            //console.log("内部setter", target.$inner);
            return _setter(target, key, value, className, o);
        }
    });

    // 这里用于控制类的外部调用
    let descObj = _inner_proxy(o, className)

    let $inner = descObj.$getInner();
    if ($inner.$constructor) {
        //console.log("实例化对象", o[$inner.$className]);
        // 构造方法不能是异步方法
        if (o[$inner.$className].toString().indexOf("_regenerator[\"default\"].async") != -1) {
            errorMsg = `Factory异常:构造对象失败，构造方法不能是异步方法`
            throw new Error(errorMsg);
        }

        let $parentInner = descObj.$getParentInner();
        // 设置父类的构造方法到super对象
        if ($parentInner && $parentInner.$inner.$constructor) {
            let paramsSchema = $parentInner.$inner.$methodsValidate.$params.get($parentInner.$inner.$className);
            descObj.$setParentsConstuctor((parentsConstuctorParams) => {
                _inner_check_params(paramsSchema, parentsConstuctorParams, $parentInner.$inner.$className, "构造方法");
                $parentInner.$inner.$constructor(parentsConstuctorParams);
                let parentsobj = descObj.$getParentObj();
                parentsobj.$setHandleConstructor();
            })
        }

        // 执行构造方法
        let paramsSchema = $inner.$methodsValidate.$params.get($inner.$className);
        _inner_check_params(paramsSchema, constructorParams, $inner.$className, "构造方法");
        $inner.$constructor.call(o, constructorParams);
        descObj.$setHandleConstructor();// 表示实例化成功
        // 检测父类的构造方法
        if ($parentInner && $parentInner.$inner.$constructor && !$parentInner.$inner.$isHandleConstructor) {
            errorMsg = `Factory异常:构造对象失败，父类${$parentInner.$inner.$className}中自定义了构造方法，必须在子类的构造方法中执行`
            throw new Error(errorMsg);
        }
        //console.log("父类的", $parentInner);
    }
    return descObj;
}

//访问控制符
function Private(target, name) {
    _inner_checkinner(target);

    var errorMsg = "";
    if (isFunction(target[name])) {

        // 检测是否已经被其他的访问修饰符修饰了
        if (target.$inner.PublicMethods && target.$inner.PublicMethods.has(name)) {
            errorMsg = `@Private修饰报错：${name}方法已经被@Public 修饰过，无法重复修饰`
            throw new Error(errorMsg);
        }

        if (target.$inner.ProtectedMethods && target.$inner.ProtectedMethods.has(name)) {
            errorMsg = `@Private修饰报错：${name}方法已经被@Protected 修饰过，无法重复修饰`
            throw new Error(errorMsg);
        }

        if (!target.$inner.PrivateMethods || target.$inner.PrivateMethods.size == 0) {
            target.$inner.PrivateMethods = new Set();
        }
        target.$inner.PrivateMethods.add(name, target.$inner.PublicMethods);
        //console.log("设置方法的私有访问权限", name,target.$inner.PublicMethods)
    }
    else {

        if (target.$inner.PublicAttr && target.$inner.PublicAttr.has(name)) {
            errorMsg = `@Private修饰报错：${name}属性已经被@Public 修饰过，无法重复修饰`
            throw new Error(errorMsg);
        }

        if (target.$inner.ProtectedAttr && target.$inner.ProtectedAttr.has(name)) {
            errorMsg = `@Private修饰报错：${name}属性已经被@Protected 修饰过，无法重复修饰`
            throw new Error(errorMsg);
        }

        if (!target.$inner.PrivateAttr || target.$inner.PrivateAttr.size == 0) {
            target.$inner.PrivateAttr = new Set();
        }
        target.$inner.PrivateAttr.add(name);
        //console.log("设置属性的私有访问权限", name)
    }
}

// //访问控制符
function Public(target, name, descriptor) {
    _inner_checkinner(target);
    if (_inner_checkinner_keywords(name)) {
        errorMsg = `定义方法或者属性异常:${name}属性或者方法 为内部保留方法/属性，不可重新定义`
        throw new Error(errorMsg);
    }

    if (isFunction(target[name])) {

        // 检测是否已经被其他的访问修饰符修饰了
        if (target.$inner.PrivateMethods && target.$inner.PrivateMethods.has(name)) {
            errorMsg = `@Public修饰报错：${name}方法已经被@Private 修饰过，无法重复修饰`
            throw new Error(errorMsg);
        }

        if (target.$inner.ProtectedMethods && target.$inner.ProtectedMethods.has(name)) {
            errorMsg = `@Public修饰报错：${name}方法已经被@Protected 修饰过，无法重复修饰`
            throw new Error(errorMsg);
        }

        if (!target.$inner.PublicMethods || target.$inner.PublicMethods.size == 0) {
            target.$inner.PublicMethods = new Set();
        }
        target.$inner.PublicMethods.add(name);
        //console.log("设置方法的公有访问权限", name,target.$inner.PublicMethods)
    }
    else {
        if (target.$inner.PrivateAttr && target.$inner.PrivateAttr.has(name)) {
            errorMsg = `@Public修饰报错：${name}属性已经被@Private 修饰过，无法重复修饰`
            throw new Error(errorMsg);
        }

        if (target.$inner.ProtectedAttr && target.$inner.ProtectedAttr.has(name)) {
            errorMsg = `@Public修饰报错：${name}属性已经被@Protected 修饰过，无法重复修饰`
            throw new Error(errorMsg);
        }
        if (!target.$inner.PublicAttr || target.$inner.PublicAttr.size == 0) {
            target.$inner.PublicAttr = new Set();
        }
        target.$inner.PublicAttr.add(name);

    }
}

// //访问控制符
function Protected(target, name, descriptor) {
    _inner_checkinner(target);
    if (isFunction(target[name])) {
        if (target.$inner.PrivateMethods && target.$inner.PrivateMethods.has(name)) {
            errorMsg = `@Protected修饰报错：${name}方法已经被@Private 修饰过，无法重复修饰`
            throw new Error(errorMsg);
        }

        if (target.$inner.PublicMethods && target.$inner.PublicMethods.has(name)) {
            errorMsg = `@Protected修饰报错：${name}方法已经被@Public 修饰过，无法重复修饰`
            throw new Error(errorMsg);
        }
        if (!target.$inner.ProtectedMethods || target.$inner.ProtectedMethods.size == 0) {
            target.$inner.ProtectedMethods = new Set();
        }
        target.$inner.ProtectedMethods.add(name);
    }
    else {

        if (target.$inner.PrivateAttr && target.$inner.PrivateAttr.has(name)) {
            errorMsg = `@Protected修饰报错：${name}属性已经被@Private 修饰过，无法重复修饰`
            throw new Error(errorMsg);
        }

        if (target.$inner.PublicAttr && target.$inner.PublicAttr.has(name)) {
            errorMsg = `@Protected修饰报错：${name}属性已经被@Public 修饰过，无法重复修饰`
            throw new Error(errorMsg);
        }

        if (!target.$inner.ProtectedAttr || target.$inner.ProtectedAttr.size == 0) {
            target.$inner.ProtectedAttr = new Set();
        }
        target.$inner.ProtectedAttr.add(name);

    }
}


//读写控制符
function Readonly(target, name, descriptor) {
    _inner_checkinner(target);
    if (isFunction(target[name])) {
        if (!target.$inner.ReadonlyMethods || target.$inner.ReadonlyMethods.size == 0) {
            target.$inner.ReadonlyMethods = new Set();
        }
        target.$inner.ReadonlyMethods.add(name);
    }
    else {

        if (!target.$inner.ReadonlyAttr || target.$inner.ReadonlyAttr.size == 0) {
            target.$inner.ReadonlyAttr = new Set();
        }
        target.$inner.ReadonlyAttr.add(name);

    }
}


//读写控制符
function Final(target, name, descriptor) {
    _inner_checkinner(target);
    if (isFunction(target[name])) {
        if (!target.$inner.FinalMethods || target.$inner.FinalMethods.size == 0) {
            target.$inner.FinalMethods = new Set();
        }
        target.$inner.FinalMethods.add(name);
    }
    else {

        if (!target.$inner.FinalAttr || target.$inner.FinalAttr.size == 0) {
            target.$inner.FinalAttr = new Set();
        }
        target.$inner.FinalAttr.add(name);

    }
}

// 属性的描述符
function Limit(value) {
    return function (target, name, descriptor) {
        let errorMsg = "";
        _inner_checkinner(target);
        if (isFunction(target[name])) {
            errorMsg = `@Limit异常：@Limit只能修饰属性，${name}为方法`
            throw new Error(errorMsg);
        }
        else {

            if (!target.$inner.AttrLimit || target.$inner.AttrLimit.size == 0) {
                target.$inner.AttrLimit = new Map();
            }
            target.$inner.AttrLimit.set(name, value);

        }

    }
}

// // 方法或者属性的描述符
// function Desc(target, name, descriptor) {
//     descriptor.writable = false;
//     return descriptor;
// }

// // 方法参数校验
function Params(value) {
    var errorMsg = ""
    if (!value) {
        errorMsg = `@Params检测异常：定义方法或者属性异常，Params 参数不能为空`
        throw new Error(errorMsg);
    }
    return function (target, name, descriptor) {


        function getName(fun) {
            return typeof fun === 'function' ?
                undefined :
                fun.name || /function (.+)\(/.exec(fun + '')[1];
        }
        let constructor = target.constructor;
        if (!constructor) {
            errorMsg = `@Params检测异常：对象的constructor读取失败`
            throw new Error(errorMsg);
        }
        let className = /function (.+)\(/.exec(constructor + '')[1];

        _inner_checkinner(target);
        if (_inner_checkinner_keywords(name)) {
            errorMsg = `@Params检测异常：定义方法或者属性异常，${name}属性或者方法 为内部保留方法/属性，不可重新定义`
            throw new Error(errorMsg);
        }

        if (isFunction(target[name])) {

            target.$inner.$methodsValidate.$params.set(name, value);
            if (className == name) {
                //console.log("构造方法 ", name, className);
                target.$inner.$className = className;
                target.$inner.$constructor = target[name];
            }
        }
        else {

            errorMsg = `@Params检测异常：只能修饰方法，${name}为属性`
            throw new Error(errorMsg);
        }
    }

}

// 方法返回值校验
function Returns(value) {


    return function (target, name, descriptor) {
        var errorMsg = ""
        _inner_checkinner(target);
        if (_inner_checkinner_keywords(name)) {
            errorMsg = `@Returns检测异常：定义方法或者属性异常，${name}属性或者方法 为内部保留方法/属性，不可重新定义`
            throw new Error(errorMsg);
        }

        if (isFunction(target[name])) {

            target.$inner.$methodsValidate.$returns.set(name, value);
        }
        else {

            errorMsg = `@Returns检测异常：只能修饰方法，${name}为属性`
            throw new Error(errorMsg);
        }
    }
}

// 类继承
function Extends(clas, constructorParams) {
    let errorMsg = "";
    if (!isFunction(clas)) {
        errorMsg = `Extends异常:继承失败，因为传入了一个非类数据`
        throw new Error(errorMsg);
    }

    if (!clas.prototype || !clas.prototype.constructor) {
        errorMsg = `Extends异常:继承失败，prototype.constructor构造函数不存在`
        throw new Error(errorMsg);
    }

    // 创建临时对象
    //let tmpObj = Factory(clas,constructorParams);
    var tmpObj = new clas(constructorParams); // 父类

    // 过滤内部的私有方法/属性
    let PrivateAttr = tmpObj.$inner && tmpObj.$inner.PrivateAttr ? tmpObj.$inner.PrivateAttr : null;
    if (PrivateAttr) {
        for (let i of PrivateAttr) {
            //console.log("属性", i)
            delete tmpObj[i]
        }
    }
    let PrivateMethods = tmpObj.$inner && tmpObj.$inner.PrivateMethods ? tmpObj.$inner.PrivateMethods : null;
    if (PrivateMethods) {
        for (let i of PrivateMethods) {
            //console.log("私有方法", i)
            delete tmpObj[i]
        }
    }
    return function decorator(target, className) {
        //console.log("继承 className",target.prototype.constructor.name);
        _inner_checkClssinner(target);

        let tmp = new target(); // 因为target 是一个类，需要临时实例化才能正常读取属性 tmp 被修饰的类
        //把父类的属性叠加到子类中   这里只能遍历到属性，无法遍历到方法
        for (let i in tmpObj) {
            if (!i) {
                continue;
            }
            // 说明是对象的保留数据
            if (_inner_checkinner_keywords(i)) {
                //console.log("内部保留方法",i);
                target.prototype.$parentInner[i] = tmpObj[i];
            }
            else // 普通的方法
            {
                // 防止覆盖子类的方法和属性 先要检测
                if ((tmp[i] !== undefined) && (tmp[i] !== "undefined")) // 如果子类存在这个方法或者属性，那么父类的方法需要放在super对象中
                {
                    if (tmpObj.$inner.FinalAttr && tmpObj.$inner.FinalAttr.has(i)) {
                        //console.log(tmp[i])
                        errorMsg = `Extends 检测异常：${i}方法为父类Final属性，子类无法覆盖(重写)`
                        throw new Error(errorMsg);
                    }
                    //console.log("设置父类 普通属性",i,tmpObj[i]);
                    target.prototype.super[i] = tmpObj[i]
                }
                else {
                    //console.log("设置子类 普通属性",i,tmp[i]);
                    target.prototype[i] = tmpObj[i];
                }
            }
            // console.log("属性遍历叠加", i);
        }
        //console.log("extends parents inner", target.prototype.$parentInner.$inner.ReadonlyAttr)

        // 设置 public方法
        //console.log("父类的public 方法  ", tmpObj.$inner.PublicMethods)
        if (tmpObj && tmpObj.$inner && tmpObj.$inner.PublicMethods) {
            //console.log("设置父类的fagnfa",tmpObj.$inner.PublicMethods);
            for (let i of tmpObj.$inner.PublicMethods) {
                if (!i) {
                    continue;
                }
                //检查当前子类中是否已经定义该方法，如果定义了，则该方法将放置到super对象中
                if (tmp[i]) {

                    if (tmpObj.$inner.FinalMethods && tmpObj.$inner.FinalMethods.has(i)) {
                        errorMsg = `Extends 检测异常：${i}方法为父类Final方法，子类无法覆盖(重写)`
                        throw new Error(errorMsg);
                    }
                    target.prototype.super[i] = tmpObj[i]
                }
                else {
                    if (!target.prototype.$inner.PublicMethods) {
                        target.prototype.$inner.PublicMethods = new Set();
                    }
                    target.prototype.$inner.PublicMethods.add(i);
                    target.prototype[i] = tmpObj[i];// 把父类的方法赋值给子类
                }
            }

        }

        // 设置 protected 方法
        if (tmpObj && tmpObj.$inner && tmpObj.$inner.ProtectedMethods) {
            //console.log("设置父类的fagnfa",tmpObj.$inner.PublicMethods);
            for (let i of tmpObj.$inner.ProtectedMethods) {
                if (!i) {
                    continue;
                }
                //检查当前子类中是否已经定义该方法，如果定义了，则该方法将放置到super对象中
                if (tmp[i]) {
                    if (tmpObj.$inner.FinalMethods && tmpObj.$inner.FinalMethods.has(i)) {
                        errorMsg = `Extends 检测异常：${i}方法为父类Final方法，子类无法覆盖(重写)`
                        throw new Error(errorMsg);
                    }
                    target.prototype.super[i] = tmpObj[i]
                }
                else {
                    if (!target.prototype.$inner.ProtectedMethods) {
                        target.prototype.$inner.ProtectedMethods = new Set();
                    }
                    target.prototype.$inner.ProtectedMethods.add(i);
                    target.prototype[i] = tmpObj[i];// 把父类的方法赋值给子类
                }
            }

        }

        // 检测是否有抽象方法， 并且子类是否已经实现了抽象方法
        if (tmpObj && tmpObj.$inner && tmpObj.$inner.AbstractMethods) {
            for (let i of tmpObj.$inner.AbstractMethods) {
                if (!i) {
                    continue;
                }
                //检查当前子类中是否把该方法定义为抽象方法，如果也是抽象方法，则报错

                // 检测子类是否有相同的抽象方法，如果有，则报错，因为子类必须实现父类的抽象方法
                if (tmp.$inner && tmp.$inner.AbstractMethods && tmp.$inner.AbstractMethods.has(i)) {
                    errorMsg = `Abstract实现异常：${i}方法为父类抽象方法，必须要实现`
                    throw new Error(errorMsg);
                }


                let abstractMethodAuthorFlag = false; // 缓存抽象方法的访问可控制修饰符号
                if ((tmp.$inner && tmp.$inner.ProtectedMethods && !tmp.$inner.ProtectedMethods.has(i)) && (tmp.$inner && tmp.$inner.PublicMethods && !tmp.$inner.PublicMethods.has(i))) {
                    errorMsg = `Abstract实现异常：${i}方法为父类抽象方法，必须要实现`
                    throw new Error(errorMsg);
                }
                else {
                    if (tmpObj.$inner && tmpObj.$inner.ProtectedMethods && tmpObj.$inner.ProtectedMethods.has(i)) {
                        abstractMethodAuthorFlag = "Protected"
                    }
                    else if (tmpObj.$inner && tmpObj.$inner.PublicMethods && tmpObj.$inner.PublicMethods.has(i)) {
                        abstractMethodAuthorFlag = "Public"
                    }
                    else {
                        errorMsg = `Abstract实现异常：读取父类的抽象方法${i}的权限访问控制修饰符失败`
                        throw new Error(errorMsg);
                    }

                }

                // 实现抽象方法的访问控制必须一致
                if (abstractMethodAuthorFlag == "Protected") {
                    if (!(tmp.$inner.ProtectedMethods && tmp.$inner.ProtectedMethods.has(i))) {
                        errorMsg = `Abstract实现异常：父类${i}方法抽象方法被@Protected修饰，子类需要保持一致`
                        throw new Error(errorMsg);
                    }
                }
                else if (abstractMethodAuthorFlag == "Public") {
                    if (!(tmp.$inner.PublicMethods && tmp.$inner.PublicMethods.has(i))) {
                        errorMsg = `Abstract实现异常：父类${i}方法抽象方法被@Public修饰，子类需要保持一致`
                        throw new Error(errorMsg);
                    }
                }
                // 实现抽象方法的参数和返回值都必须一致
                if (tmpObj.$inner.$methodsValidate.$params.has(i)) {
                    if (!tmp.$inner.$methodsValidate.$params.has(i)) {
                        errorMsg = `Abstract实现异常：父类${i}方法抽象方法定义了Params格式，子类必须定义`
                        throw new Error(errorMsg);
                    }
                    let p1 = JSON.parse(JSON.stringify(tmp.$inner.$methodsValidate.$params.get(i)))
                    let p2 = JSON.parse(JSON.stringify(tmpObj.$inner.$methodsValidate.$params.get(i)))
                    if (!_deepCompare(p1, p2)) {
                        errorMsg = `Abstract实现异常：父类${i}方法抽象方法的Params数据格式和子类实现时的Params数据格式不一致`
                        throw new Error(errorMsg);
                    }
                }

                if (tmpObj.$inner.$methodsValidate.$returns.has(i)) {
                    if (!tmp.$inner.$methodsValidate.$returns.has(i)) {
                        errorMsg = `Abstract实现异常：父类${i}方法抽象方法定义了Returns格式，子类必须定义`
                        throw new Error(errorMsg);
                    }
                    if (!_deepCompare(tmp.$inner.$methodsValidate.$params.get(i), tmpObj.$inner.$methodsValidate.$params.get(i))) {
                        errorMsg = `Abstract实现异常：父类${i}方法抽象方法的Returns数据格式和子类实现时的Returns数据格式不一致`
                        throw new Error(errorMsg);
                    }
                }

            }
        }

        target.prototype.$inner.$parentObj = tmpObj; //设置父类对象；
        return target;
    }
}


// 抽象方法修饰
function Abstract(target, name, descriptor) {
    _inner_checkinner(target);
    if (_inner_checkinner_keywords(name)) {
        errorMsg = `@Abstract修饰异常：定义方法或者属性异常，${name}属性或者方法 为内部保留方法/属性，不可重新定义`
        throw new Error(errorMsg);
    }

    if (isFunction(target[name])) {

        if ((!target.$inner.PublicMethods || !target.$inner.PublicMethods.has(name)) && (!target.$inner.ProtectedMethods || !target.$inner.ProtectedMethods.has(name))) {
            errorMsg = `@Abstract修饰报错：${name}方法必须是被@Public或者@Protected修饰`
            throw new Error(errorMsg);
        }

        if (!target.$inner.AbstractMethods || target.$inner.AbstractMethods.size == 0) {
            target.$inner.AbstractMethods = new Set();
        }

        target.$inner.AbstractMethods.add(name);
        //console.log("设置方法的公有访问权限", name,target.$inner.PublicMethods)
    }
    else {
        errorMsg = `@Abstract修饰报错：${name}应该为方法，不能为属性，因为@Abstract只能修饰方法`
        throw new Error(errorMsg);
    }
}

// 可以不用Joi检测的数据类型
class Any {

}

module.exports = {
    Factory,
    Private,
    Protected,
    Public,
    Readonly,
    Params,
    Returns,
    Extends,
    Abstract,
    Limit,
    "Schema": Limit,
    Final,
    Joi,
    Any,
}
