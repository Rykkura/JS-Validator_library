function Validator(options) {
    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }
    var formElement = document.querySelector(options.form);
    var selectorRules = {};
    //hàm thực hiện validate
    function validate(inputElement, rule) {
        var errorElement = getParent(
            inputElement,
            options.formGroupSelector
        ).querySelector(options.errorSelector);

        var errorMessage;
        //lấy ra các rules của selector
        var rules = selectorRules[rule.selector];
        //lặp qua từng rule và kiểm tra,  nếu có lỗi thì break
        for (var i = 0; i < rules.length; ++i) {
            switch (inputElement.type) {
                case "radio":
                case "checkbox":
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ":checked")
                    );
                    break;
                default:
                    errorMessage = rules[i](inputElement.value);
            }
            if (errorMessage) break;
        }
        //lấy ra thẻ form-message để hiển thị ra error

        if (errorMessage) {
            errorElement.innerText = errorMessage;
            getParent(inputElement, options.formGroupSelector).classList.add(
                "invalid"
            );
        } else {
            errorElement.innerText = "";
            getParent(inputElement, options.formGroupSelector).classList.remove(
                "invalid"
            );
        }
        return !errorMessage;
    }
    if (formElement) {
        formElement.onsubmit = (e) => {
            e.preventDefault();

            var isFormValid = true;

            //thực hiện lặp qua từng rule và validate khi ấn submit

            options.rules.forEach((rule) => {
                var inputElement = formElement.querySelector(rule.selector);

                var isValid = validate(inputElement, rule);
                if (!isValid) {
                    isFormValid = false;
                }
            });
            if (isFormValid) {
                if (typeof options.onSubmit === "function") {
                    var enableInputs = formElement.querySelectorAll(
                        "[name]:not([disable])"
                    );
                    var formValues = Array.from(enableInputs).reduce(
                        (values, input) => {
                            switch (input.type) {
                                case "radio":
                                    values[input.name] =
                                        formElement.querySelector(
                                            'input[name="' +
                                                input.name +
                                                '"]:checked'
                                        ).value;
                                    break;
                                case "checkbox":
                                    if (!input.matches(":checked")) {
                                        values[input.name] = "";
                                        return values;
                                    }
                                    if (!Array.isArray(values[input.name])) {
                                        values[input.name] = [];
                                    }
                                    values[input.name].push(input.value);
                                    break;
                                case "file":
                                    values[input.name] = input.files;
                                    break;
                                default:
                                    values[input.name] = input.value;
                            }
                            return values;
                        },
                        {}
                    );
                    options.onSubmit(formValues);
                }
            }
        };
        //lặp qua mỗi rule và xử lý
        options.rules.forEach((rule) => {
            //Lưu lại các rules cho mỗi input
            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test);
            } else {
                selectorRules[rule.selector] = [rule.test];
            }

            //lấy ra input có id là fullname và email
            var inputElements = formElement.querySelectorAll(rule.selector);
            Array.from(inputElements).forEach((inputElement) => {
                inputElement.onblur = () => {
                    validate(inputElement, rule);
                };
                //xử lý mỗi khi người dùng nhập vào input
                inputElement.oninput = () => {
                    var errorElement = getParent(
                        inputElement,
                        options.formGroupSelector
                    ).querySelector(options.errorSelector);
                    errorElement.innerText = "";
                    getParent(
                        inputElement,
                        options.formGroupSelector
                    ).classList.remove("invalid");
                };
            });
        });
    }
}
//định nghĩa các rule
//nguyên tắc của các rule :
//1. Khi có lỗi thì trả ra message lỗi
//2. khi hợp lệ thì ko trả ra gì cả
Validator.isRequired = (selector, message) => {
    return {
        selector: selector,
        test: (value) => {
            //value.trim(): loại bỏ các dấu cách trong trường hợp người dùng chỉ nhập nguyên dấu cách
            return value.trim()
                ? undefined
                : message || "Vui lòng nhập trường này";
        },
    };
};
Validator.isEmail = (selector, message) => {
    return {
        selector: selector,
        test: (value) => {
            var regex = /^[\w\-\.]+@([\w-]+\.)+[\w-]{2,}$/gm; //biểu thức chính quy kiểm tra định dạng email
            return regex.test(value)
                ? undefined
                : message || "Trường này phải là email"; //phương thức test sử dụng biểu thức chính quy regex để kiểm tra value có đúng định dạng hay ko
        },
    };
};
Validator.minLength = (selector, min, message) => {
    return {
        selector: selector,
        test: (value) => {
            return value.length >= min
                ? undefined
                : message || `Vui lòng nhập tối thiểu ${min} ký tự`; //phương thức test sử dụng biểu thức chính quy regex để kiểm tra value có đúng định dạng hay ko
        },
    };
};
Validator.isConfirmed = (selector, getConfirmValue, message) => {
    return {
        selector: selector,
        test: (value) => {
            return value === getConfirmValue()
                ? undefined
                : message || "Giá trị nhập vào không chính xác";
        },
    };
};
