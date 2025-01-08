import React, { createContext, useEffect, useState } from 'react';

const ActivityLogContext = createContext({});

const ActivityLogProvider = ({ initialActivityLog, children }) => {
    const activityLog = initialActivityLog || {};


    return (
        <ActivityLogContext.Provider value={activityLog}>
            {children}
        </ActivityLogContext.Provider>
    );
};

export { ActivityLogContext, ActivityLogProvider };
