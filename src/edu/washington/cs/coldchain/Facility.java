package edu.washington.cs.coldchain;

import java.util.List;
import java.util.Map;
import java.util.Set;

import com.google.appengine.api.datastore.Entity;

/**
 * Represents a single facility from the database. A facility has a unique ID and
 * values for each of a number of features.
 *
 * @author Melissa Winstanley
 */
public class Facility {
    private Map<String, Object> features;
    private String id;
    
    /**
     * Create a new facility with the given values for each given field. Converts
     * any fn_latitude/fn_longitude coordinates from UTM to lat/lon.
     *
     * @param keys the field IDs
     * @param values the values for each corresponding field ID
     */
    // TODO: Get rid of fn_latitude, generalize ID field
    public Facility(String[] keys, String[] values) {
        features = new JSONMap<String, Object>();
        for (int i = 0; i < keys.length; i++) {
            features.put(keys[i], i < values.length ? values[i] : "ERROR");
        }
        
        // convert UTM to lat/long if applicable
        //if (features.containsKey("fn_latitude") && features.containsKey("fn_longitude")) {
        //    processUTM((String)features.get("fn_latitude"), (String)features.get("fn_longitude"));
        //}
        // set the ID to be the facility ID
        id = values[0];
    }
    
    /**
     * @return all features of the facility
     */
    public Set<String> getKeys() {
        return features.keySet();
    }
    
    /**
     * @param key the feature of interest
     * @return the value of the feature for this facility
     */
    public Object get(String key) {
        return features.get(key);
    }
    
    /**
     * @return the database ID of this facility
     */
    public String getID() {
        return id;
    }
    
    /**
     * @return a datastore entity corresponding to this facility.
     */
    public Entity getEntity() {
        Entity facility = new Entity("Facility");
        for (String key : features.keySet()) {
            Object value = features.get(key);
            facility.setProperty(key, value == null ? "" : value.toString());
        }
        return facility;
    }
    
    /**
     * Add a vaccine schedule to the facility, with the given fields and values.
     *
     * @param key the name of the vaccine schedule
     * @param header the field IDs for the schedule
     * @param values the values for each corresponding field ID
     */
    public void putSchedule(String key, String[] header, String[] values) {
        Map<String, Object> subObj = new JSONMap<String, Object>();
        
        // save fields of interest into the subobj
        for (int i = 4; i < 7; i++) {
            subObj.put(header[i], values[i]);
        }
        
        // consolidate the surplus fields into a single field
        subObj.put("Surplus", "2");
        for (int i = 7; i < 12; i++) {
            if (values[i].equals("1")) {
                subObj.put("Surplus", String.valueOf(11 - i));
                break;
            }
        }
        
        // add the schedule to the set of features
        features.put(key, subObj);
    }
    
    /**
     * Add a refrigerator to this facility, with the given field values.
     *
     * @param header the field IDs for the fridge
     * @param values the values for each corresponding field ID
     */
    @SuppressWarnings("unchecked")
    public void addFridge(String[] header, String[] values) {
        if (features.get("fridges") == null) {
            features.put("fridges", new JSONMap<String, Map<String, String>>());
        }
        Map<String, String> subObj = new JSONMap<String, String>();
        for (int i = 1; i < header.length; i++) {
            String val = (i >= values.length) ? "" : values[i];
            subObj.put(header[i], val);
        }
        ((Map<String, Map<String, String>>)features.get("fridges")).put(values[0], subObj);
    }
    
    /**
     * Returns a JSON-formatted string detailing the facility features and values.
     */
    public String toString() {
        return features.toString();
    }
    
    /**
     * Returns a JSON-formatted string detailing the facility features that are present
     * in the given set of features and their corresponding values.
     *  
     * @param keys the features of interest
     * @return a JSON-formatted string version of the features and their values
     */
    public String getString(List<Field> fields) {
        return ((JSONMap<String, Object>)features).getString(fields);
    }
    
    /**
     * Adds fn_latitude and fn_longitude coordinates to the facility, converting from
     * the given UTM coordinates.
     * 
     * @param lat UTM latitude of the facility
     * @param lon UTM longitude of the facility
     */
    private void processUTM(String lat, String lon) {
        double[] translated = UTMConverter.parseUTM(lat, lon, 36, true);
        if (translated == null) {
            features.put("fn_latitude", null);
            features.put("fn_longitude", null);
        } else {
            features.put("fn_latitude", String.valueOf(translated[0]));
            features.put("fn_longitude", String.valueOf(translated[1]));
        }
    }
}
