import { localeString, optionalProperties } from '../src/constants';

export interface WPQueryOptions {
    baseUrl: string;
    page: number;
    pageSize: number;
    questionType?: string;
}

export interface WPAuthHeaders {
    headers?: {
        Authorization: string;
    };
}

export interface WPResponse {
    data?: Question[];
}

export interface Question extends OptionalMediaProps<typeof optionalProperties> {
    id: number;
    question_title: string;
    question_type: string;
    explanation: string;
    secondary_text?: string;
}

export interface ContentfulQuestion {
    fields: {
        questionTitle: {
            [localeString]: string;
        };
        questionType: {
            [localeString]: string;
        };
        wordpressId: {
            [localeString]: number;
        };
        explanation: {
            [localeString]: string;
        };
        secondaryText?: {
            [localeString]: string;
        };
        images?: {
            [localeString]: AssetLink[];
        };
        markedImages?: {
            [localeString]: AssetLink[];
        };
        videos?: {
            [localeString]: AssetLink[];
        };
    };
}

export interface Media {
    contentType: string;
    fileName: string;
    url: string;
}

export interface AssetLink {
    sys: {
        id: string;
    };
}

export interface InputField {
    id: string;
    label: string;
}

export interface FieldGroup {
    id: string;
    label: string;
    data: InputField[];
}

type OptionalMediaProps<T extends readonly string[]> = {
    [K in T[number]]?: string | number;
};
