package edu.washington.cs.coldchain;

import java.util.HashMap;
import java.util.Iterator;
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
    public String getString(Set<String> keys) {
        if (toString == null) {
            StringBuilder result = new StringBuilder();
            result.append("\n{ ");
            Iterator<K> iter = this.keySet().iterator();
            K key = iter.next();
            V value = get(key);
            boolean print = keys.contains(key);
            String toPrint;
            if (value instanceof String) {
                toPrint = "\"" + value + "\"";
            } else {
                toPrint = value.toString();
            }
            if (print) {
                result.append("\"" + key + "\": " + toPrint);
            }
            while (iter.hasNext()) {
                key = iter.next();
                value = get(key);
                boolean newPrint = keys.contains(key);
                if (value == null) {
                    toPrint = "\"\"";
                } else if (value instanceof String) {
                    toPrint = "\"" + value + "\"";
                } else {
                    toPrint = value.toString();
                }
                if (newPrint) {
                    if (print) {
                        result.append(", ");
                    }
                    result.append("\"" + key + "\": " + toPrint);
                    print = true;
                }
            }
            result.append(" } ");
            toString = result.toString();
        }
        return toString;
    }
}
