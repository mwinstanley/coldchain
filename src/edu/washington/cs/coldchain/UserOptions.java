package edu.washington.cs.coldchain;

import java.util.ArrayList;
import java.util.List;

import javax.jdo.annotations.IdGeneratorStrategy;
import javax.jdo.annotations.PersistenceCapable;
import javax.jdo.annotations.Persistent;
import javax.jdo.annotations.PrimaryKey;

@PersistenceCapable(detachable="true")
public class UserOptions {
    @Persistent
    private List<String> fields;
    
    private List<String> names;
    @Persistent
    private List<Integer> types;
    @PrimaryKey
    @Persistent(valueStrategy = IdGeneratorStrategy.IDENTITY)
    private Long userID;
    
    // TODO: CHECK INPUT
    // {field,name,type}{field,name,type}
    public UserOptions(String data) {
        fields = new ArrayList<String>();
        names = new ArrayList<String>();
        types = new ArrayList<Integer>();
        String[] units = data.split("}");
        for (String u : units) {
            if (u.length() > 0) {
                u = u.substring(1);
                String[] attrs = u.split(",");
                fields.add(attrs[0]);
                names.add(attrs[1]);
                types.add(Integer.valueOf(attrs[2]));
            }
        }
    }
    
    public Long getID() {
        return userID;
    }
    
    public String toString() {
        String result = "";
        for (int i = 0; i < fields.size(); i++) {
            String s = fields.get(i);
            result += "\"" + s + "\": {\"name\": \"" + names.get(i) + "\", \"type\": " + types.get(i) + "},";
        }
        return "{" + result.substring(0, result.length() - 1) + "}";
    }
    
    public void reviseOptions(String newOptions) {
        fields = new ArrayList<String>();
        names = new ArrayList<String>();
        types = new ArrayList<Integer>();
        String[] units = newOptions.split("}");
        for (String u : units) {
            if (u.length() > 0) {
                u = u.substring(1);
                String[] attrs = u.split(",");
                fields.add(attrs[0]);
                names.add(attrs[1]);
                types.add(Integer.valueOf(attrs[2]));
            }
        }
    }
}
