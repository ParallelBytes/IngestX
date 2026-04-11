type TypeStringConfig = {
    type: "string";
    allowedValues?: string[];
    regex?: string;
}

type TypeNumberConfig = {
    type: "number";
    min?: number;
    max?: number;
    allowedValues?: number[];
}

type TypeBooleanConfig = {
    type: "boolean";
    trueValues?: string[];
}

type TypeConfig = TypeStringConfig | TypeNumberConfig | TypeBooleanConfig;

type Transformer<T = any> = (
    value: T,
    row?: Record<string, any>
) => T

type Validator<T = any> = (
    value: T,
    row?: Record<string, any>
) => boolean

type BaseColumnConfig = {
    displayNames: string[]; // (csv header can be NAME, Name, fullname)
    key: string; // key in the final json
    validationRequired: boolean;
    defaultValue?: string | number | boolean;
    isDuplicatesAllowed?: boolean;
    fallbackToDefaultValue?: boolean; // if true and value validation fails use default value
    transform?: Transformer
    customValidation?: Validator; // if false record will be rejected
}

export type ColumnConfig = BaseColumnConfig & TypeConfig;


export type ErrorsData = {
    rowIndex: number,
    errors: {
        column: string,
        message: string
    }[]
}[]

// {
//   rowIndex: 2,
//   errors: [
//     { column: "email", message: "Invalid email" }
//   ]
// }