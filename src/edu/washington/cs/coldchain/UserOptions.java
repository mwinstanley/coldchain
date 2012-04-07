package edu.washington.cs.coldchain;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.jdo.PersistenceManager;
import javax.jdo.annotations.Element;
import javax.jdo.annotations.FetchGroup;
import javax.jdo.annotations.IdGeneratorStrategy;
import javax.jdo.annotations.PersistenceCapable;
import javax.jdo.annotations.Persistent;
import javax.jdo.annotations.PrimaryKey;

import com.google.appengine.api.datastore.Key;

import flexjson.JSONDeserializer;
import flexjson.JSONSerializer;

/**
 * Stores options for which aspects of the database are of interest in
 * the map. Also stores what human-readable names are associated with the
 * fields, and what the type of the field is.
 * 
 * @author Melissa Winstanley
 */
@PersistenceCapable(detachable="true")
@FetchGroup(name="fields", members={@Persistent(name="fields"),
        @Persistent(name="fieldNames"), @Persistent(name="files")})
public class UserOptions {
    @Persistent
    private List<Field> fields;
    
    @Persistent
    private List<String> fieldNames;
        
    @Element(dependent="true")
    private List<FileSummary> files;
    
    /** An ID associated with each unique user option. */
    @PrimaryKey
    @Persistent(valueStrategy = IdGeneratorStrategy.IDENTITY)
    private Long userID;
    
    // TODO: INPUT VALIDATION
    /**
     * Creates a new set of user options from the given values. The
     * options are given in the following format:
     *     {field,name,type}{field,name,type}...
     * where fields and names are strings and types are integers.
     * 
     * @param data the fields of interest and their associated names
     *             and types
     */
    public UserOptions(String data) {
        fields = new ArrayList<Field>();
        fieldNames = new ArrayList<String>();
        files = new ArrayList<FileSummary>();
        reviseFiles(data, null);
    }
    
    public String getMainFileName() {
        if (files.size() > 0) {
            return files.get(0).name;
        } else {
            return null;
        }
    }
    
    public String getFridgeFileName() {
        if (files.size() > 1) {
            return files.get(1).name;
        } else {
            return null;
        }
    }
    
    public List<String> getScheduleFileNames() {
        if (files.size() > 1) {
            List<String> res = new ArrayList<String>();
            for (int i = 2; i < files.size(); i++) {
                res.add(files.get(i).name);
            }
            return res;
        } else {
            return null;
        }
    }
    
    public List<FileSummary> getFiles() {
        return files;
    }
    
    /**
     * @return the ID of this options object.
     */
    public Long getID() {
        return userID;
    }
    
    public List<Field> getFields() {
        return fields;
    }
    
    /**
     * @return a String representation of this user options object. The
     *         format is:
     *             {field: {name: name, type: type},field: {name:...
     */
    @Override
    public String toString() {
        JSONSerializer serializer = new JSONSerializer();
        return serializer.exclude("*.class").include("fields.values").include("files").serialize(this);
        /*
        String result = "";
        for (int i = 0; i < fields.size(); i++) {
            String s = fields.get(i);
            result += "\"" + s + "\": {\"name\": \"" + names.get(i) +
                      "\", \"type\": " + types.get(i) + "},";
        }
        return "{" + result.substring(0, result.length() - 1) + "}";*/
    }
    
    /**
     * Updates this options object, replacing the selected fields,
     * names, and types with those read from the given string.
     * 
     * @param newOptions the fields of interest and their associated names
     *                   and types
     */
    // MUST BE IN JSON ARRAY OF FIELDS FORMAT
    public void reviseOptions(String newOptions, PersistenceManager pm) {
        Set<String> newFields = new HashSet<String>();
        newOptions = newOptions.trim();
        newOptions = newOptions.substring(1, newOptions.length() - 1); // remove brackets
        String[] units = newOptions.split("}");
        for (String u : units) {
            u = u.trim();
            if (u.length() > 0) {
                u = u.substring(1);
                String[] attrs = u.split(",");
                String id = separateJSON(attrs[0]);
                int index = fieldNames.indexOf(id);
                newFields.add(id);
                if (index > -1) {
                    fields.get(index).setFieldType(separateJSON(attrs[2]));
                    fields.get(index).setName(separateJSON(attrs[1]));
                } else {
                    fields.add(new Field(id, separateJSON(attrs[1]),
                                     separateJSON(attrs[2])));
                    fieldNames.add(id);
                }
            }
        }
        for (int i = fields.size() - 1; i >= 0; i--) {
            if (!newFields.contains(fields.get(i).getId())) {
                pm.deletePersistent(fields.remove(i));
                fieldNames.remove(i);
            }
        }
    }
    
    public void deleteValues(PersistenceManager pm) {
        for (Field f : fields) {
            f.deleteValues(pm);
        }
    }
    
    public void reviseFiles(String values, PersistenceManager pm) {
        List valuesList = (List) new JSONDeserializer().deserialize(values);
        List<FileSummary> newFiles = new ArrayList<FileSummary>();
        FileSummary cur = new FileSummary();
        cur.type = "main";
        cur.name = ((Map<String, String>)valuesList.get(0)).get("file");
        newFiles.add(cur);
        Map<String, String> valMap = (Map<String, String>)valuesList.get(1);
        cur = new FileSummary();
        cur.type = "fridge";
        cur.name = valMap.get("file");
        cur.main = valMap.get("joinMain");
        cur.secondary = valMap.get("joinSecondary");
        newFiles.add(cur);
        for (int i = 2; i < valuesList.size(); i++) {
            valMap = (Map<String, String>)valuesList.get(i);
            cur = new FileSummary();
            cur.type="schedule";
            cur.name = valMap.get("file");
            cur.main = valMap.get("joinMain");
            cur.secondary = valMap.get("joinSecondary");
            newFiles.add(cur);
        }
        
        if (files != null) {
            for (int i = 0; i < Math.min(valuesList.size(), files.size()); i++) {
                FileSummary orig = files.get(i);
                FileSummary change = newFiles.get(i);
                if (orig.getName().equals(change.getName())) {
                    orig.main = change.main;
                    orig.secondary = change.secondary;
                    orig.type = change.type;
                } else {
                    pm.deletePersistent(orig);
                    files.set(i, change);
                }
            }
            for (int i = files.size(); i < newFiles.size(); i++) {
                files.add(newFiles.get(i));
            }
            for (int i = newFiles.size(); i < files.size(); i++) {
                pm.deletePersistent(files.remove(i));
            }
        }
    }
    
    /**
     * 
     * {"id": "field_id", "displayType": "DISPLAY_TYPE", "values": [{"id": "value_id", "name": "readable_name", "color": "color"}]}
     * @param values
     */
    @SuppressWarnings("rawtypes")
    public void updateValues(String values, PersistenceManager pm) {
        this.deleteValues(pm);
        List valuesMap = (List) new JSONDeserializer().deserialize(values);
        System.out.println(valuesMap.getClass());
        System.out.println(((Map<String, Object>)valuesMap.get(0)).get("id"));
        int valIndex = 0;
        for (int i = 0; i < fields.size(); i++) {
            Map<String, Object> val = (Map<String, Object>)valuesMap.get(valIndex);
            Field curField = fields.get(i);
            if (curField.getId().equals(val.get("id"))) {
                curField.setDisplay((String)val.get("displayType"), (String)val.get("inInfoBox"),
                        (List<Map<String, String>>)val.get("values"));
                valIndex++;
            }
            
        }
    }
    
    private String separateJSON(String s) {
        s = s.split(":")[1].trim();
        if (s.startsWith("\"")) {
            s = s.substring(1, s.length() - 1);
        }
        return s;
    }
    
    @PersistenceCapable
    private static class FileSummary {
        public String getName() {
            return name;
        }
        public String getType() {
            return type;
        }
        public String getMain() {
            return main;
        }
        public String getSecondary() {
            return secondary;
        }

        @Persistent
        private String name;
        @Persistent
        private String type;
        @Persistent
        private String main;
        @Persistent
        private String secondary;
        @PrimaryKey       @Persistent(valueStrategy = 
                IdGeneratorStrategy.IDENTITY) 
                       private Key id_key;
    }
}
