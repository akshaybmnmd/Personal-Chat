// -----------------------personalhashing---------------------

function reverseString(str) {
    var reverseArray = str.split("").reverse();
    return reverseArray.join("");
}

function salt(str) {
    var myArr = Array.from(str);
    var saltedArr = [];
    myArr.forEach((item, index) => {
        saltedArr.push(item + random(3));
    });
    if (saltedArr.length % 2 != 0) {
        saltedArr.push(random(1));
    }
    return saltedArr.join('');
}

function random(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789,./!@#$%^&*()_+-=';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function splithalf(str) {
    var str1 = str.substring(0, (str.length / 2));
    var str2 = str.substring((str.length / 2));
    return str2 + str1;
}

function hash(str) {
    str = reverseString(str);
    str = salt(str);
    str = splithalf(str);
    str = reverseString(str);
    return str
}

function unsalt(str) {
    var myArr = Array.from(str);
    var unsaltedArr1 = [];
    var unsaltedArr = [];
    myArr.forEach((item, index) => {
        if (index % 2 == 0) {
            unsaltedArr1.push(item);
        }
    });
    unsaltedArr1.forEach((item, index) => {
        if (index % 2 == 0) {
            unsaltedArr.push(item);
        }
    });
    return unsaltedArr.join('');
}

function unhash(str) {
    str = reverseString(str);
    str = splithalf(str);
    str = unsalt(str);
    str = reverseString(str);
    return str;
}