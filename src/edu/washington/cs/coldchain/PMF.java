package edu.washington.cs.coldchain;

import javax.jdo.JDOHelper;
import javax.jdo.PersistenceManagerFactory;

/**
 * Factory for persistance management - used for creating singleton instance
 * of the persistance manager (connecting to App Engine datastore).
 * 
 * @author Melissa Winstanley
 */
public final class PMF {
    private static final PersistenceManagerFactory pmfInstance =
        JDOHelper.getPersistenceManagerFactory("transactions-optional");

    private PMF() {}

    /**
     * @return a persistance manager factory for this application.
     */
    public static PersistenceManagerFactory get() {
        return pmfInstance;
    }
}