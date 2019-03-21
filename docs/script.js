// netstandard support for each platform; https://docs.microsoft.com/en-us/dotnet/standard/net-standard and https://immo.landwerth.net/netstandard-versions/#
const support = {
    "netcoreapp": {
        "1.0": "1.6",
        "1.1": "1.6",
        "2.0": "2.0",
        "2.1": "2.0",
        "2.2": "2.0",
        "3.0 (preview)": "2.1"
    },
    "net": {
        "4.5": "1.0",
        "4.5.1": "1.2",
        "4.5.2": "1.2",
        "4.6": "1.6",
        "4.6.1": "2.0", // actually not; see special rule (2)
        "4.6.2": "2.0", // actually not; see special rule (2)
        "4.7": "2.0", // actually not; see special rule (2)
        "4.7.1": "2.0", // actually not; see special rule (2)
        "4.7.2": "2.0",
        "4.8 (preview)": "2.0"
    },
    "mono": {
        "4.6": "1.6",
        "5.4": "2.0",
        "6.2 (preview)": "2.1"
    },
    "xamarinios": {
        "10.0": "1.6",
        "10.14": "2.0",
        "12.12 (preview)": "2.1"
    },
    "xamarinandroid": {
        "7.0": "1.6",
        "8.0": "2.0",
        "9.3 (preview)": "2.1"
    },
    "xamarinmac": {
        "3.0": "1.6",
        "3.8": "2.0"
    },
    "uwp": {
        "10.0": "1.4",
        "10.0.16299": "2.0"
    },
    "unity": {
        "2018.1": "2.0"
    },
    "win": {
        "8.0": "1.1",
        "8.1": "1.2"
    },
    "wpa": {
        "8.1": "1.2"
    },
    "wpsl": {
        "8.0": "1.0"
    }
}

const selected = {
    "netcoreapp": "2.0",
    "net": "4.7.2",
    "mono": "",
    "xamarinios": "",
    "xamarinandroid": "",
    "xamarinmac": "",
    "uwp": "",
    "unity": "",
    "win": "",
    "wpa": "",
    "wpsl": ""
}

const MAXIMUM_VERSION_PART = 100;

/**
 * Calculates the numeric value of a 2- or 3-part version string, where none of the version parts will ever be >= MAXIMUM_VERSION_PART.
 * @param {string} value 
 * @returns {number}
 */
function numericVersion(value) {
    const values = value.split(".");
    let result = MAXIMUM_VERSION_PART * MAXIMUM_VERSION_PART * values[0] + MAXIMUM_VERSION_PART * values[1];
    if (values.length > 2) {
        result += values[2];
    }
    return result;
}

/**
 * Converts a numeric value to a 2- or 3-part version string.
 * @param {number} value 
 */
function stringVersion(value) {
    let major = Math.floor(value / (MAXIMUM_VERSION_PART * MAXIMUM_VERSION_PART));
    let result = major + ".";
    value -= major * MAXIMUM_VERSION_PART * MAXIMUM_VERSION_PART;
    let minor = Math.floor(value / MAXIMUM_VERSION_PART);
    result += minor;
    value -= minor * MAXIMUM_VERSION_PART;
    if (value !== 0) {
        result += "." + value;
    }
    return result;
}

/** A numeric version that is higher than any real netstandard version. */
const NO_VERSION = MAXIMUM_VERSION_PART * MAXIMUM_VERSION_PART * MAXIMUM_VERSION_PART;
const NETSTANDARD14 = 10400;
const NETSTANDARD20 = 20000;

/**
 * Calculates the TFMs that should be targeted, separated by ';'
 * @returns {string}
 */
function calculateResults() {
    // Find the lowest possible netstandard.
    let lowestNetstandard = NO_VERSION;
    for (const platform of Object.keys(selected)) {
        const platformVersion = selected[platform];
        if (platformVersion === "") {
            continue;
        }

        const platformSupport = numericVersion(support[platform][platformVersion]);
        if (platformSupport < lowestNetstandard) {
            lowestNetstandard = platformSupport;
        }
    }

    // If not enough platforms are selected, just result with nothing.
    if (lowestNetstandard === NO_VERSION) {
        return "please select at least one platform";
    }

    // Apply all the special rules.

    let netstandardTargets = [lowestNetstandard];
    let result = "netstandard" + stringVersion(lowestNetstandard);

    // 1) If we want to target netstandard < 2.0, then also include a netstandard2.0 TFM.
    //    This prevents the dependency insanity brought in from NETStandard.Library on NuGet.
    if (lowestNetstandard < NETSTANDARD20) {
        netstandardTargets.push(NETSTANDARD20);
        result += ";netstandard" + stringVersion(NETSTANDARD20);
    }

    // 2) If we are targeting any netstandard > 1.4 and <= 2.0, then also include a net461 TFM.
    //    This prevents problems where NuGet thinks net461 supports those netstandard platforms, when it doesn't.
    if (netstandardTargets.some((value) => value > NETSTANDARD14 && value <= NETSTANDARD20)) {
        result += ";net461";
    }

    return result;
}

function $platformButton(platform, value) {
    return $("#buttons-" + platform + " button[value='" + selected[platform] + "'")
}

function buttonClick(platform, value) {
    // Unselect any existing selected button.
    if (selected[platform]) {
        $platformButton(platform, selected[platform]).removeClass("btn-primary").addClass("btn-light");
    }
    
    // Select the new selected button.
    if (selected[platform] === value) {
        selected[platform] = "";
    } else {
        selected[platform] = value;
        $platformButton(platform, value).removeClass("btn-light").addClass("btn-primary");
    }

    // Prevent the "active" visual state.
    $platformButton(platform, value).blur();

    // Recalculate and display the result.
    const result = calculateResults();
    $("#result").attr("value", result.indexOf(";") === -1 ? "<TargetFramework>" + result + "</TargetFramework>" : "<TargetFrameworks>" + result + "</TargetFrameworks>");
}

function preselect() {

}

function addClickHandlers(platform) {
    $("#buttons-" + platform + " button").click(function () { buttonClick(platform, $(this).attr("value")); });
}

$(function () {
    // Add a "value" attribute to each options button equal to its innerText.
    $("#options-table button").attr("value", function () { return this.innerText; })

    // Set up click handlers.
    for (let platform of Object.keys(support)) {
        addClickHandlers(platform);
    }
});