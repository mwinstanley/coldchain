package edu.washington.cs.coldchain;

import java.util.Map;
import java.util.Set;

import com.google.appengine.api.datastore.Entity;

public class Facility {
    private Map<String, Object> features;
    private String id;
    
    public Facility(String[] keys, String[] values) {
        features = new JSONMap<String, Object>();
        for (int i = 0; i < keys.length; i++) {
            features.put(keys[i], i < values.length ? values[i] : "ERROR");
        }
        if (features.containsKey("fn_latitude")) {
            processUTM((String)features.get("fn_latitude"), (String)features.get("fn_longitude"));
        }
        id = values[0];
    }
    
    public Set<String> getKeys() {
        return features.keySet();
    }
    
    public Object get(String key) {
        return features.get(key);
    }
    
    public String getID() {
        return id;
    }
    
    public Entity getEntity() {
        Entity facility = new Entity("Facility");
        for (String key : features.keySet()) {
            Object value = features.get(key);
            facility.setProperty(key, value == null ? "" : value.toString());
        }
        return facility;
    }
    
    public void putSchedule(String key, String[] header, String[] values) {
        Map<String, Object> subObj = new JSONMap<String, Object>();
        for (int i = 4; i < 7; i++) {
            subObj.put(header[i], values[i]);
        }
        subObj.put("Surplus", "2");
        for (int i = 7; i < 12; i++) {
            if (values[i].equals("1")) {
                subObj.put("Surplus", String.valueOf(11 - i));
                break;
            }
        }
        features.put(key, subObj);
    }
    
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
    
    public String toString() {
        return features.toString();
    }
    
    public String getString(Set<String> keys) {
        return ((JSONMap<String, Object>)features).getString(keys);
    }
    
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
