/** Config Starts. **/
const cred = PropertiesService.getScriptProperties().getProperty("cred");
const skGameRole = PropertiesService.getScriptProperties().getProperty("skGameRole");
const sign = PropertiesService.getScriptProperties().getProperty("sign");

const profiles = [
    {
        cred,
        skGameRole,
        platform: "3",
        vName: "1.0.0",
        sign,
    }
];

/** Config ends. **/

const attendanceUrl = 'https://zonai.skport.com/web/v1/game/endfield/attendance';

async function main() {
    const messages = await Promise.all(profiles.map(autoClaimFunction));
    const endfieldResp = `${messages.join('\n\n')}`;

    // Just log result now
    console.log(endfieldResp);
}

function autoClaimFunction({ cred, skGameRole, platform, vName, accountName }) {
    console.log(`[${accountName}] Checking credentials and performing check-in...`);
    
    const timestamp = Math.floor(Date.now() / 1000).toString();

    let token = "";
    try {
        token = refreshToken(cred, platform, vName);
        console.log(`[${accountName}] Token refreshed successfully.`);
    } catch (e) {
        console.error(`[${accountName}] Token refresh failed: ${e.message}`);
    }

    const sign = generateSign(
        '/web/v1/game/endfield/attendance',
        '',
        timestamp,
        token,
        platform,
        vName
    );

    const header = {
        'User-Agent': 'Mozilla/5.0',
        'Accept': '*/*',
        'Content-Type': 'application/json',
        'sk-language': 'en',
        'sk-game-role': skGameRole,
        'cred': cred,
        'platform': platform,
        'vName': vName,
        'timestamp': timestamp,
        'sign': sign,
        'Origin': 'https://game.skport.com',
        'Referer': 'https://game.skport.com/'
    };

    const options = {
        method: 'POST',
        headers: header,
        muteHttpExceptions: true,
    };

    let response = `Daily reward claim for ${accountName}`;

    try {
        const endfieldResponse = UrlFetchApp.fetch(attendanceUrl, options);
        const responseJson = JSON.parse(endfieldResponse.getContentText());

        if (responseJson.code === 0) {
            response += '\nClaim successful!';
            const awards = responseJson.data.awardIds.map(award => {
                const resource = responseJson.data.resourceInfoMap[award.id];
                return `${resource.name}: ${resource.count}`;
            }).join(', ');
            response += `\nAwards: ${awards}`;
        } else if (responseJson.code === 10001) {
            response += '\nAlready claimed today.';
        } else {
            response += `\nError: ${responseJson.message}`;
        }
    } catch (error) {
        response += `\nFailed to claim: ${error.message}`;
    }

    return response;
}

/** Helper: Refresh token **/
function refreshToken(cred, platform, vName) {
    const refreshUrl = 'https://zonai.skport.com/web/v1/auth/refresh';

    const header = {
        'Accept': 'application/json',
        'cred': cred,
        'platform': platform,
        'vName': vName,
        'Origin': 'https://game.skport.com',
        'Referer': 'https://game.skport.com/'
    };

    const options = {
        method: 'GET',
        headers: header,
        muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(refreshUrl, options);
    const json = JSON.parse(response.getContentText());

    if (json.code === 0 && json.data?.token) {
        return json.data.token;
    }
    throw new Error(json.message);
}

/** Signature generation **/
function generateSign(path, body, timestamp, token, platform, vName) {
    let str = path + body + timestamp;
    const headerJson = `{"platform":"${platform}","timestamp":"${timestamp}","dId":"","vName":"${vName}"}`;
    str += headerJson;

    const hmacBytes = Utilities.computeHmacSha256Signature(str, token || '');
    const hmacHex = bytesToHex(hmacBytes);
    const md5Bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, hmacHex);

    return bytesToHex(md5Bytes);
}

function bytesToHex(bytes) {
    return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}
