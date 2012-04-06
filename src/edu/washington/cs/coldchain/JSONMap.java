package edu.washington.cs.coldchain;

import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

/**
 * A version of HashMap that has a toString in JSON format.
 *
 * @author Melissa Winstanley
 */
public class JSONMap<K, V> extends HashMap<K, V> {
    private static final long serialVersionUID = 1L;
    private String toString;
    public String toString() {
        if (toString == null) {
            StringBuilder result = new StringBuilder();
            result.append("{ ");
            Iterator<K> iter = this.keySet().iterator();
            K key = iter.next();
            V value = get(key);
            String toPrint;
            if (value instanceof String) {
                toPrint = "\"" + value + "\"";
            } else {
                toPrint = value.toString();
            }
            result.append("\"" + key + "\": " + toPrint);
            while (iter.hasNext()) {
                result.append(", ");
                key = iter.next();
                value = get(key);
                if (value == null) {
                    toPrint = "\"\"";
                } else if (value instanceof String) {
                    toPrint = "\"" + value + "\"";
                } else {
                    toPrint = value.toString();
                }
                result.append("\"" + key + "\": " + toPrint);
            }
            result.append(" } ");
            toString = result.toString();
        }
        return toString;
    }
    
    /**
     * Returns the toString for only the specified subset of keys.
     */
    @SuppressWarnings("unchecked")
    public String getString(List<Field> keys) {
        //if (toString == null) {
            StringBuilder result = new StringBuilder();
            result.append("\n{ ");
            boolean print = false;
            double[] utm = null;
            for (int i = 0; i < keys.size(); i++) {
                Field f = keys.get(i);
                V value = get(f.getId());
                
                // ASSUMES THAT LAT/LON PAIR ALWAYS GIVEN
                if (f.getDisplayType().equals("UTMLAT")) {
                    utm = UTMConverter.parseUTM((String)get(f.getId()), (String)get(keys.get(i+1).getId()), 36, true);
                    if (utm != null) {
                        value = (V) String.valueOf(utm[0]);
                    } else {
                        value = null;
                    }
                } else if (f.getDisplayType().equals("UTMLON")) {
                    if (utm != null) {
                        value = (V) String.valueOf(utm[1]);
                    } else {
                        value = null;
                    }
                }
                String toPrint;
                if (value == null) {
                    toPrint = "\"\"";
                } else if (value instanceof String) {
                    toPrint = "\"" + value + "\"";
                } else {
                    toPrint = value.toString();
                }
                if (print) {
                    result.append(", ");
                }
                result.append("\"" + f.getId() + "\": " + toPrint);
                print = true;
            }
            result.append(" } ");
            return result.toString();
        //}
        //return toString;
    }
}
