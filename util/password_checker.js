class Rule {
    constructor(valid_formatter, invalid_formatter, test_satisfy) {
        this.valid_formatter = valid_formatter;
        this.invalid_formatter = invalid_formatter;
        this.test_satisfy = test_satisfy;
    }

    satisfies(password) {
        const [result, result_string] = this.test_satisfy(this.valid_formatter, this.invalid_formatter, password);
        this.result_string = result_string;
        return result;
    }
}

class PasswordChecker {
    constructor() {
        this.rules = [];
        this.revealed_rules = [];
        this.revealed_indices = new Set();
        this.all_valid = false;
    }

    add_rule(rule) {
        this.rules.push(rule);
    }

    check_password(password, only_revealed_rules=false) {
        let results = [];
        this.all_valid = true;
        for (const rule of this.revealed_rules) {
            const result = rule.satisfies(password);
            this.all_valid &= result;
            results.push([result, rule.result_string]);
        }
        for (let i = 0; i < this.rules.length; ++i) {
            if (i in this.revealed_indices)
                continue
            const rule = this.rules[i];
            const result = rule.satisfies(password);
            if (!result && this.all_valid && !only_revealed_rules) {
                this.all_valid = false;
                results.push([result, rule.result_string]);
                this.revealed_rules.push(rule);
                this.revealed_indices.add(i);
                return results;
            }
            this.all_valid &= result;

        }
        return results;
    }

}

export {Rule, PasswordChecker}
