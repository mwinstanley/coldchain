package edu.washington.cs.coldchain;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Arrays;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Scanner;
import java.util.Set;

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
        String fileName = req.getParameter("file");
        String type = req.getParameter("type");
        Scanner input = new Scanner(new File(fileName));
        if (facilities.isEmpty()) {
            getResponse(input);
        }
        if (type.equals("h")) {
            getKeys(resp.getWriter(), fileName);
        } else if (type.equals("d")){
            printFacilities(resp.getWriter());
        }
    }
    
    private void getKeys(PrintWriter writer, String file) throws IOException {
        writer.print(new Scanner(new File(file)).nextLine());
        /*Iterator<String> keys = facilities.values().iterator().next().getKeys().iterator();
        writer.print(keys.next());
        while (keys.hasNext()) {
            writer.print("," + keys.next());
        }*/
    }
    
    private void printFacilities(PrintWriter writer) {
        writer.print("[");
        Iterator<Facility> iter = facilities.values().iterator();
        String obj = iter.next().getString(IMPORTANT_INDICES);
        writer.print(obj);
        while (iter.hasNext()) {
            obj = iter.next().getString(IMPORTANT_INDICES);
            writer.print(", " + obj);
        }
        writer.print("]");
    }
    
    private void getResponse(Scanner input) throws IOException {
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
        Scanner fridges = new Scanner(new File("TBL_INV_REF.csv"));
        header = fridges.nextLine().split(",");
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
