import {Rule, PasswordChecker} from "./util/password_checker.js"
import {ResultsDisplay} from "./util/results_display.js"
import {BackgroundManager} from "./background/background_manager.js"

const planets = ["merkur", "venus", "erde", "mars", "jupiter", "saturn", "uranus", "neptun"];
const chess_pieces = ["könig", "dame", "turm", "läufer", "springer", "bauer"]
const vowels = "aeiouAEIOUäöüÄÖÜ"
const italy_wc_final_years = ["1934", "1938", "1982", "2006"]
const primes = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199]);

const legal_characters = "abcdefghijklmnopqrstuvwxyzöäüßABCDEFGHIJKLMNOPQRSTUVWXYZÖÄÜ1234567890!§$%&/()=<>,;.:-_#'+*´`^°\\\"][{}€";
const legal_characters_set = new Set(legal_characters.split(""));

function reverse(string) {
    return string.split("").reverse().join("");
}

const audio_player =
`<div class="hint">
  <span>Das folgende Musikstück muss referenziert werden:</span>
  <audio controls>
    <source src="assets/music.mp3" type="audio/mpeg">
    Dein Browser unterstützt das Audio-Element nicht.
  </audio>
</div>`

const rules = [
    new Rule((cs) => `Das Passwort besteht aus ${cs} Zeichen.`,
             "Muss mindestens zehn Zeichen haben.",
             (sf, nsf, pw) => pw.length >= 10 ? [true, sf(pw.length)] : [false, nsf]
            ),

    new Rule("Es werden nur Zeichen aus dem Hintergrund verwendet.",
             (c) => `Es dürfen nur Zeichen aus dem Hintergrund verwendet werden, '${c}' nicht erlaubt.`,
             (sf, nsf, pw) => {
                for (const letter of pw) {
                    if (!legal_characters_set.has(letter)) {
                        return [false, nsf(letter)];
                    }
                }
                return [true, sf];
             }
            ),

    new Rule((p, ds) => `Verwendet die Ziffer${p} ${ds}.`,
             "Muss mindestens eine Ziffer verwenden.",
             (sf, nsf, pw) => {
                const re = /\d/g;
                if (re.test(pw)) {
                    let digits = pw.match(re);
                    return [true, sf(digits.length > 1 ? "n" : "", digits.join(", "))];
                }
                return [false, nsf];
             }
            ),

    new Rule((p) => `🪐🌎 Planeten gefunden: ${p}.`,
             "Muss einen Planeten des Sonnensystems enthalten.",
             (sf, nsf, pw) => {
                let lower = pw.toLowerCase();
                for (const planet of planets) {
                    let index = lower.indexOf(planet);
                    if (index >= 0) {
                        return [true, sf(pw.substring(index, index + planet.length))];
                    }
                }
                return [false, nsf];
             }
            ),

    new Rule("Ist ein Palindrom.",
             (rev) => `Muss ein Palindrom sein, ist von hinten gelesen aber "${rev}."`,
             (sf, nsf, pw) => {
                let n = pw.length;
                for (let i = 0; i < n / 2; i++) {
                    if (pw[i] != pw[n - i - 1])
                        return [false, nsf(reverse(pw))];
                }
                return [true, sf];
             }
            ),

    new Rule((sum) => `Summe aller Ziffern und der Wortlänge ist prim (${sum}).`,
             (sum) => `Summe aller Ziffern und der Wortlänge muss prim sein, ist aber ${sum}.`,
             (sf, nsf, pw) => {
                const re = /\d/g;
                const digits = pw.match(re);
                const value = pw.length + (digits == null ? 0 : digits.map(x => parseInt(x)).reduce((t, c) => {return t + c}));
                if (primes.has(value)) {
                    return [true, sf(value)];
                }
                return [false, nsf(value)];
             }
            ),

    new Rule("Jedes Zeichen kommt maximal zweimal vor",
             (l, c) => `Jedes Zeichen darf maximal zweimal auftauchen ('${l}' gibt es ${c}-mal)`,
             (sf, nsf, pw) => {
                let letter_counts = {}
                for (const letter of pw) {
                    if (!(letter in letter_counts)) {
                        letter_counts[letter] = 0;
                    }
                    letter_counts[letter]++;
                }
                for (const key in letter_counts) {
                    if (letter_counts[key] > 2) {
                        return [false, nsf(key, letter_counts[key])];
                    }
                }
                return [true, sf];
             }
            ),


    new Rule("Alle Kleinbuchstaben stehen zusammen.",
             "Alle Kleinbuchstaben müssen zusammenstehen.",
             (sf, nsf, pw) => {
                const les = /[a-zäöü]+/g;
                const groups = pw.match(les);
                if (groups && groups.length > 1) {
                    return [false, nsf];
                }
                return [true, sf];
             }
            ),

    new Rule((year) => `Enthält ein Jahr, in dem Italien die Fußball-WM gewann: ${year}`,
             "Muss ein Jahr enthalten, in dem Italien die Fußball-WM gewann.",
             (sf, nsf, pw) => {
                for (const year of italy_wc_final_years) {
                    let index = pw.indexOf(year);
                    if (index >= 0) {
                        return [true, sf(pw.substring(index, index + year.length))];
                    }
                }
                return [false, nsf];
             }
            ),

    new Rule((piece) => `Enthält eine Schachfigur: ${piece}`,
         "Muss den Namen einer Schachfigur enthalten.",
         (sf, nsf, pw) => {
            const lower = pw.toLowerCase()
            for (const piece of chess_pieces) {
                let index = lower.indexOf(piece);
                if (index >= 0) {
                    return [true, sf(pw.substring(index, index + piece.length))];
                }
            }
            return [false, nsf];
         }
        ),

    new Rule((cs) => `Das Passwort besteht aus ${cs} Zeichen.`,
             "Darf maximal 27 Zeichen haben.",
             (sf, nsf, pw) => pw.length <= 27 ? [true, sf(pw.length)] : [false, nsf]
            ),


    new Rule("Jeder Kleinbuchstabe kommt auch als Großbuchstabe vor",
         (char) => `Jeder Kleinbuchstabe muss auch als Großbuchstabe vorkommen, aber '${char}' gibt es nur klein.`,
         (sf, nsf, pw) => {
            if (pw.length == 0)
                return [true, sf];
            const upper_case = /[A-ZÄÖÜ]/g;
            const lower_case = /[a-zäöü]/g;
            let found_letters = new Set();
            for (const letter of pw.match(upper_case)) {
                found_letters.add(letter.toLowerCase());
            }
            for (const letter of pw.match(lower_case)) {
                if (!found_letters.has(letter)) {
                    return [false, nsf(letter)];
                }
            }
            return [true, sf];
         }
        ),

    new Rule("'BWV289' erfolgreich erkannt.",
         audio_player,
         (sf, nsf, pw) => {
            if (pw.indexOf("BWV289") >= 0) {
                return [true, sf];
            }
            return [false, nsf];
         }
        ),
    new Rule((money) => `Geldbetrag erkannt: ${money}`,
        "Muss einen Geldbetrag zwischen 100 und 99999 Euro enthalten.",
        (sf, nsf, pw) => {
            const money_re = /\d{3,5}(?:,\d+)?€/g;
            let match = pw.match(money_re);
            if (match) {
                return [true, sf(match[0])];
            }
            return [false, nsf];
        })
]


function init_logic() {
    let pw_checker = new PasswordChecker();
    for (const rule of rules) {
        pw_checker.add_rule(rule);
    }

    let password_field = document.getElementById("password-field");
    let results_display = new ResultsDisplay(document.getElementById('results'));
    let validate = (total, only_revealed_rules=false, by_enter=false) => {
        let results = pw_checker.check_password(password_field.value, only_revealed_rules);
        results_display.update_results(results, pw_checker.all_valid && !only_revealed_rules);
        if (pw_checker.all_valid && by_enter) {
            alert("Sehr gut, ihr habt das Passwort erraten! Bitte öffnet den Umschlag mit der Wolke.")
            console.log("All good! Logging in...");
        }
    }
    document.getElementById("validate").onclick = () => {validate(pw_checker.rules.length)}
    window.addEventListener("keydown", event => {
        if (event.key == "Enter")
            validate(pw_checker.rules.length, false, true);
    })
    password_field.oninput = () => {
        validate(results_display.revealed, true);
    }

}

function init_background_animation() {
    let bg_manager = new BackgroundManager(document.getElementById("animated-bg"), [document.getElementById("top-text")], legal_characters);
}

document.addEventListener("DOMContentLoaded", () => {
    init_logic();
    init_background_animation();
})
