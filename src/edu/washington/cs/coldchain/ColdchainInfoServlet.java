package edu.washington.cs.coldchain;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Enumeration;
import java.util.Scanner;

import javax.jdo.PersistenceManager;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class ColdchainInfoServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    @Override
    public void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        resp.setContentType("text/plain");
        String fileName = req.getParameter("file");
        if (fileName != null) {
            Scanner input = new Scanner(new File(fileName));
            PrintWriter writer = resp.getWriter();
            writer.print(input.nextLine() + "\t");
        }
        
        String strID = req.getParameter("id");
        if (strID != null) {
            long id = Long.parseLong(strID);
            PersistenceManager pm = PMF.get().getPersistenceManager();
            UserOptions opt = pm.getObjectById(UserOptions.class, id);
            PrintWriter writer = resp.getWriter();
            writer.print(opt.toString());
        }
    }
    
    @Override
    public void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        PersistenceManager pm = PMF.get().getPersistenceManager();
        PrintWriter writer = resp.getWriter();
        String values = req.getParameter("val");
        UserOptions opt;
        if (req.getParameter("id") != null) {
            opt = getUserOptions(Long.parseLong(req.getParameter("id")));
            opt.reviseOptions(values);
        } else {
            opt = new UserOptions(values);
        }
        try {
            pm.makePersistent(opt);
        } finally {
            pm.close();
            writer.print(opt.getID());
        }
    }
    
    private UserOptions getUserOptions(long id) {
        PersistenceManager pm = PMF.get().getPersistenceManager();
        UserOptions options, detached = null;
        try {
            options = pm.getObjectById(UserOptions.class, id);
            detached = pm.detachCopy(options);
        } finally {
            pm.close();
        }
        return detached;
    }
}
