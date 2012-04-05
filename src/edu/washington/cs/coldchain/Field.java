package edu.washington.cs.coldchain;

import java.util.List;

import javax.jdo.annotations.Element;
import javax.jdo.annotations.IdGeneratorStrategy;
import javax.jdo.annotations.PersistenceCapable;
import javax.jdo.annotations.Persistent;
import javax.jdo.annotations.PrimaryKey;

import com.google.appengine.api.datastore.Key;

import flexjson.JSONDeserializer;
import flexjson.JSONSerializer;

/**
 * Represents a field in the database. Fields have ids, human-readable names,
 * a type, possibly a display form, and possibly a list of possible values
 * (for discrete options).
 *
 * @author Melissa Winstanley
 */
@PersistenceCapable
public class Field {
    /** The ID assigned to this field in the original data set. */
    @Persistent
    private String id;
    
    /** The human-readable name of this field. */
    @Persistent
    private String name;
    
    /** The type of the field, continuous/discrete/unique/string. */
    @Persistent
    private String fieldType;
    
    /** How to display the data, map/filter/size. */
    @Persistent
    private String displayType;
    
    /** All possible values for discrete types of data. */
    @Element(dependent = "true")
    private List<Value> values;
    
    @PrimaryKey       @Persistent(valueStrategy = 
            IdGeneratorStrategy.IDENTITY) 
                   private Key id_key;
    
    /**
     * Construct a new field with the given properties.
     * 
     * @param id the ID of the field in the database
     * @param name the human-readable name of the field
     * @param type the type of the field (0-3)
     */
    public Field(String id, String name, String type) {
        this.id = id;
        this.name = name;
        this.fieldType = (type.toUpperCase());
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getFieldType() {
        return fieldType;
    }

    public void setFieldType(String fieldType) {
        this.fieldType = fieldType;
    }

    public String getDisplayType() {
        return displayType;
    }

    public void setDisplayType(String displayType) {
        this.displayType = displayType;
    }

    public List<Value> getValues() {
        return values;
    }

    public void setValues(List<Value> values) {
        this.values = values;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
    
    /**
     * Sets the display properties of this field. Display properties consist of
     * a specific display type and a list of possible values (for mapping or
     * filter display only).
     *
     * @param display one of "map", "filter", or "size", indicating either a mapping
     *                display (displayed for each facility), filter display (selecting
     *                a subset of facilities), or size display (altering the size of
     *                the markers for each facility)
     * @param options a JSON-formatted array of values (value consists of
     *                id, name, color) 
     */
    public void setDisplay(String display, String options) {
        this.displayType = (display.toUpperCase());
        if (displayType != "SIZE") {
            JSONDeserializer<List<Value>> deserializer = new JSONDeserializer<List<Value>>();
            values = deserializer.deserialize(options, Value.class);
        }
    }
    
    /**
     * @return true if the display type of this field has been set, false otherwise
     */
    /*public boolean isComplete() {
        return displayType != null;
    }*/
    
    @Override
    public String toString() {
        JSONSerializer serializer = new JSONSerializer();
        return serializer.exclude("*.class").exclude("*.id_key").include("values").serialize(this);
        /*
        String result = id + " : ";
        result += "{ name : " + name;
        result += ", type : " + fieldType;
        result += ", display : " + displayType;
        result += ", values: [ ";
        for (String key : values.keySet()) {
            result += " { value : " + key;
            result += " , name : " + values.get(key);
            result += " , color : " + colors.get(key) + " },";
        }
        result = result.substring(0, result.length() - 1);
        result += " ] }";
        return result;*/
    }
    
    /**
     * Stores a value for a particular field.
     */
    @PersistenceCapable
    private static class Value {
        @Persistent
        private String id;
        @Persistent
        private String name;
        @Persistent
        private String color;
        
        @PrimaryKey       @Persistent(valueStrategy = 
                IdGeneratorStrategy.IDENTITY) 
                       private Key id_key;
        
        public boolean equals(Object o) {
            if (o.getClass() == getClass()) {
                Value v = (Value) o;
                return v.id == id &&
                       v.name.equals(name) &&
                       v.color.equals(color);
            } else {
                return false;
            }
        }
    }
}
