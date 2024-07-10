
const constants = {
    ANONYMOUS: "Anonymous"
}

export const isAnonymous = (email) => {
    return (
        !(typeof email === "string") ||
        email.localeCompare(constants.ANONYMOUS) === 0
    );
};

export default constants;