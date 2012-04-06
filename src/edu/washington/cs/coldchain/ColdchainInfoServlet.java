package edu.washington.cs.coldchain;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Enumeration;
import java.util.Map;

import javax.jdo.JDOObjectNotFoundException;
import javax.jdo.PersistenceManager;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.datanucleus.exceptions.NucleusObjectNotFoundException;

/**
 * Serves information related to user-selected options - which fields
 * in the database are of interest.
 * 
 * Operations:
 *     GET:  user options with an ID
 *     POST: update an existing user options
 *     PUT:  create a new user options
 * 
 * @author Melissa Winstanley
 */
public class ColdchainInfoServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    /**
     * Performs a get request, returning the user options data
     * (in JSON format) associated with the specified user ID
     */
    @Override
    public void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        resp.setContentType("text/plain");
        /*String fileName = req.getParameter("file");
        if (fileName != null) {
            Scanner input = new Scanner(new File(fileName));
            PrintWriter writer = resp.getWriter();
            writer.print(input.nextLine() + "\t");
        }
        */
        String strID = req.getParameter("id");
        if (strID != null) {
            long id = Long.parseLong(strID);
            PersistenceManager pm = PMF.get().getPersistenceManager();
            try {
                UserOptions opt = pm.getObjectById(UserOptions.class, id);
                PrintWriter writer = resp.getWriter();
                writer.print(opt.toString());
            } catch (JDOObjectNotFoundException ex) {
                
            } finally {
                pm.close();
            }
        }
    }
    
    /**
     * Performs a post request, saving the specified user options data as
     * either a new user option (if no ID is given) or an update to an
     * existing user profile (if ID is given).
     *      Params:
     *          id -   the optional user options ID
     *          type - whether to update fields ('f') or values ('v')
     *          data - the information stored.
     */
    @SuppressWarnings("rawtypes")
    @Override
    public void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        Map params = req.getParameterMap();
        if (params.containsKey("id") && params.containsKey("data") && params.containsKey("type")) {
            String values = req.getParameter("data");
            String id = req.getParameter("id");
            String type = req.getParameter("type");
            
            UserOptions opt = null;
            if (type.equals("f")) {
                updateOptionsFields(Long.parseLong(id), values, resp.getWriter());
            } else if (type.equals("v")) {
                updateOptionsValues(Long.parseLong(id), values, resp.getWriter());
            } else if (type.equals("s")) {
                updateOptionsFiles(Long.parseLong(id), values, resp.getWriter());
            }
        }
    }
    
    /**
     * Performs a put request, saving the specified user options data as
     * a new user option.
     */
    @Override
    public void doPut(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String values = req.getParameter("data");
        UserOptions opt = new UserOptions(values);
        update(opt, req, resp);
    }
    
    private void updateOptionsFiles(long id, String values, PrintWriter writer) {
        PersistenceManager pm = PMF.get().getPersistenceManager();
        UserOptions options = null;
        try {
            options = pm.getObjectById(UserOptions.class, id);
            pm.deletePersistentAll(options.getFields());
            options.reviseFiles(values);
        } finally {
            pm.close();
            if (options != null) {
                writer.print(options.getID());
            }
        }
    }
    
    private void updateOptionsFields(long id, String values, PrintWriter writer) {
        PersistenceManager pm = PMF.get().getPersistenceManager();
        UserOptions options = null;
        try {
            options = pm.getObjectById(UserOptions.class, id);
            pm.deletePersistentAll(options.getFields());
            options.reviseOptions(values);
        } finally {
            pm.close();
            if (options != null) {
                writer.print(options.getID());
            }
        }
    }
    
    private void updateOptionsValues(long id, String values, PrintWriter writer) {
        PersistenceManager pm = PMF.get().getPersistenceManager();
        pm.getFetchPlan().addGroup("fields");
        pm.getFetchPlan().addGroup("values");
        UserOptions options = null;
        try {
            options = pm.getObjectById(UserOptions.class, id);
            options.deleteValues(pm);
            options.updateValues(values);
        } finally {
            pm.close();
            if (options != null) {
                writer.print(options.getID());
            }
        }
    }
    
    private void update(UserOptions opt, HttpServletRequest req,
                        HttpServletResponse resp) throws IOException {
        PersistenceManager pm = PMF.get().getPersistenceManager();
        pm.getFetchPlan().addGroup("fields");
        pm.getFetchPlan().addGroup("values");
        PrintWriter writer = resp.getWriter();
        try {
            pm.makePersistent(opt);
        } finally {
            pm.close();
            writer.print(opt.getID());
        }
    }
    
    private UserOptions getUserOptions(long id, boolean deleteFields, boolean deleteValues) {
        PersistenceManager pm = PMF.get().getPersistenceManager();
        pm.getFetchPlan().addGroup("fields");
        pm.getFetchPlan().addGroup("values");
        UserOptions options, detached = null;
        try {
            options = pm.getObjectById(UserOptions.class, id);
            detached = pm.detachCopy(options);
            if (deleteFields) {
                pm.deletePersistentAll(options.getFields());
            } else if (deleteValues) {
                options.deleteValues(pm);
            }
        } finally {
            pm.close();
        }
        return detached;
    }
}
