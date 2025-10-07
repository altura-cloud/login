function add_result_div(parent, satisfied, text) {
    let div = document.createElement("div");
    div.className = "result";
    div.classList.add(satisfied ? "satisfied" : "not-satisfied");
    div.classList.add("added");
    div.innerHTML = text;
    parent.appendChild(div);
    div.classList.remove("added");
}

function update_result_div(result, satisfied, text) {
    result.className = "result";
    result.classList.add(satisfied ? "satisfied" : "not-satisfied");
    result.innerHTML = text;
}

class ResultsDisplay {
    constructor(parent_div) {
        this.parent_div = parent_div;
        this.revealed = 0;
    }

    update_results(results, all_valid=false) {
        let i = 0;
        for (; i < this.parent_div.children.length; i++) {
            const [satisfied, text] = results[i];
            update_result_div(this.parent_div.children[i], satisfied, text);
        }
        for (; i < results.length; i++) {
            const [satisfied, text] = results[i];
            add_result_div(this.parent_div, satisfied, text);
        }
        this.revealed = results.length;
        // if (all_valid) {
        //     add_result_div(this.parent_div, true, "Sie werden nun eingeloggt...")
        // }
    }
}

export {ResultsDisplay}