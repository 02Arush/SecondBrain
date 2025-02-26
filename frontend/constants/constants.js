
export const constants = {
    ANONYMOUS: "Anonymous",
    NO_TASK_DEADLINE: "No Deadline",
    TASK_LIST: "TaskList",
    HABIT_LIST: "habitList",
    ROLE: {
        OWNER: "owner",
        ADMIN: "admin",
        MEMBER: "member",
        INVITED: "invited",
        NONE: "none",
    },

    DAILY_CHECK_IN: "dailyCheckIn"
}

export const ROLE_POWERS = {
    [constants.ROLE.OWNER]: 3,
    [constants.ROLE.ADMIN]: 2,
    [constants.ROLE.MEMBER]: 1,
    [constants.ROLE.NONE]: 0,
    [constants.ROLE.INVITED]: 0
}



export const isAnonymous = (email) => {
    return (
        !(typeof email === "string") ||
        email.localeCompare(constants.ANONYMOUS) === 0
    );
};

export default constants;