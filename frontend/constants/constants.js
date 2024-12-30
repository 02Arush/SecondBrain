
const constants = {
    ANONYMOUS: "Anonymous",
    NO_TASK_DEADLINE: "No Deadline",
    TASK_LIST: "TaskList"
}



export const isAnonymous = (email) => {
    return (
        !(typeof email === "string") ||
        email.localeCompare(constants.ANONYMOUS) === 0
    );
};

export default constants;