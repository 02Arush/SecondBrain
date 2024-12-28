import React, { createContext, useEffect, useState } from 'react';
import { getSignedInUser } from '@/api/db_ops';

const HabitContext = createContext(new Habit("NULL_HABIT", "NULL_UNIT"));
import Habit from '@/api/habit';

const HabitProvider = ({ initialHabit, children }) => {

    const habit = initialHabit instanceof Habit ? initialHabit : new Habit("NULL_HABIT", "NULL_UNIT")

    return (
        <HabitContext.Provider value={habit}>
            {children}
        </HabitContext.Provider>
    );
};

export { HabitContext, HabitProvider };
