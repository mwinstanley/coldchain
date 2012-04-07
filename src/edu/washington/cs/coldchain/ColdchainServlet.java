package edu.washington.cs.coldchain;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Arrays;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Scanner;
import java.util.Set;

import javax.jdo.JDOObjectNotFoundException;
import javax.jdo.PersistenceManager;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

//import com.google.appengine.api.datastore.DatastoreService;
//import com.google.appengine.api.datastore.DatastoreServiceFactory;

/**
 * 
 * Operations:
 *     GET:  return either all data or headers only
 *     POST: 
 *     PUT:  
 * 
 * @author Melissa Winstanley
 */
public class ColdchainServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private static final Map<String, Facility> facilities = new LinkedHashMap<String, Facility>();
    private static final Set<String> IMPORTANT_INDICES = new HashSet<String>();
    //private static final DatastoreService DATASTORE = DatastoreServiceFactory.getDatastoreService();

    
    /**
     * Parameters:
     *     file - which file to deal with
     *     type - what type of data to return (either 'h' for headers or
     *            'd' for all data)
     */
    @Override
    public void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        resp.setContentType("text/plain");
        String type = req.getParameter("type");
        long id;
        try {
            id = Long.parseLong(req.getParameter("id"));
        } catch (Exception e) {
            id = 2454;
        }
        
        PersistenceManager pm = PMF.get().getPersistenceManager();
        pm.getFetchPlan().addGroup("fields");
        pm.getFetchPlan().addGroup("values");
        List<Field> userFields = null;
        UserOptions opt = null;
        try {
            opt = pm.getObjectById(UserOptions.class, id);
            userFields = opt.getFields();
        } catch (JDOObjectNotFoundException ex) {
            
        } finally {
            pm.close();
        }
        String fileName = opt.getMainFileName();
        String fridgeFile = opt.getFridgeFileName();
        List<String> scheduleFiles = opt.getScheduleFileNames();
        if (facilities.isEmpty()) {
            getResponse(fileName, fridgeFile);
        }
        if (type.equals("h")) {
            getKeys(resp.getWriter(), fileName, fridgeFile, scheduleFiles);
        } else if (type.equals("d")) {
            printFacilities(opt, userFields, resp.getWriter(), id);
        }
    }
    
    private void getKeys(PrintWriter writer, String mainFile, String fridgeFile, List<String> scheduleFiles) throws IOException {
        writer.print(new Scanner(new File(mainFile)).nextLine() + "\n" + new Scanner(new File(fridgeFile)).nextLine());
        for (int i = 0; i < scheduleFiles.size(); i++) {
            writer.print("\n" + new Scanner(new File(scheduleFiles.get(i))).nextLine());
        }
        /*Iterator<String> keys = facilities.values().iterator().next().getKeys().iterator();
        writer.print(keys.next());
        while (keys.hasNext()) {
            writer.print("," + keys.next());
        }*/
    }
    
    private void printFacilities(UserOptions opt, List<Field> userFields, PrintWriter writer, long id) {
        writer.print("{\"options\": " + opt.toString() + ", \"facilities\": ");
        writer.print("[");
        Iterator<Facility> iter = facilities.values().iterator();
        String obj = iter.next().getString(userFields);
        writer.print(obj);
        while (iter.hasNext()) {
            obj = iter.next().getString(userFields);
            writer.print(", " + obj);
        }
        writer.print("]}");
    }
    
    private void getResponse(String mainFile, String fridgeFile) throws IOException {
        Scanner input = new Scanner(new File(mainFile));
        Scanner baseVol = new Scanner(new File("VaccineVolume_Base.csv"));
        Scanner pcvVol = new Scanner(new File("VaccineVolume_PCV.csv"));
        Scanner rotaVol = new Scanner(new File("VaccineVolume_Rota.csv"));
        String[] header = input.nextLine().split(",");
        String[] baseHeader = baseVol.nextLine().split(","); pcvVol.nextLine(); rotaVol.nextLine();
        while (input.hasNextLine()) {
            String[] line = input.nextLine().split(",");
            if (line.length > 0) {
                Facility facility = new Facility(header, line);
                facility.putSchedule("base_schedule", baseHeader, baseVol.nextLine().split(","));
                facility.putSchedule("pcv_schedule", baseHeader, pcvVol.nextLine().split(","));
                facility.putSchedule("rota_schedule", baseHeader, rotaVol.nextLine().split(","));
                facilities.put(facility.getID(), facility);
            }
        }
        
        // add fridges
        Scanner fridges = new Scanner(new File(fridgeFile));
        header = fridges.nextLine().split(",");
        System.out.println(Arrays.toString(header));
        while (fridges.hasNextLine()) {
            String[] line = fridges.nextLine().split(",");
            if (line.length > 0) {
                facilities.get(line[1]).addFridge(header, line);
            }
        }
        /*
        for (Facility facility : facilities.values()) {
            DATASTORE.put(facility.getEntity());
        }*/

    }
    
    @Override
    public void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String[] params = req.getParameterValues("key");
        IMPORTANT_INDICES.addAll(Arrays.asList(params));
        
    }
}
