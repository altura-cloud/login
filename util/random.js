function randint(lower, upper) {
    if (upper === undefined) {
        upper = lower;
        lower = 0;
    }
    return Math.floor(lower) + Math.floor(Math.random() * (upper - lower))
}


function get_random_element(array) {
    return array[randint(array.length)];
}

function blur_value(value, change_prob, min_value, max_value) {
    if (Math.random() < change_prob)
        return value;
    if (Math.random() < 0.5) {
        value = Math.min(value + 1, max_value);
    } else {
        value = Math.max(value - 1, min_value);
    }
    return value;
}

export {randint, get_random_element, blur_value}