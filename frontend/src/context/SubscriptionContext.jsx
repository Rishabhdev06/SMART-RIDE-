import React, { createContext, useState } from 'react'

export const SubscriptionDataContext = createContext()

const SubscriptionContext = ({ children }) => {

    const [ subscription, setSubscription ] = useState(null)

    return (
        <SubscriptionDataContext.Provider value={{ subscription, setSubscription }}>
            {children}
        </SubscriptionDataContext.Provider>
    )
}

export default SubscriptionContext
