package edu.washington.cs.coldchain;

import javax.jdo.annotations.PersistenceCapable;

@PersistenceCapable
public enum FieldType {
    CONTINUOUS, DISCRETE, UNIQUE, STRING;
    
    public static FieldType getType(int val) {
        switch (val) {
        case 0:
            return DISCRETE;
        case 1:
            return CONTINUOUS;
        case 2:
            return UNIQUE;
        default:
            return STRING;
        }
    }
}
