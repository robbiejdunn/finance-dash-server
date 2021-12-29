import { CognitoUserPool } from "amazon-cognito-identity-js";

const poolData = {
    UserPoolId: "eu-west-2_XNxv1CWuJ",
    ClientId: "3aeub26jqigjkt9frj5hvi6a22",
};

export default new CognitoUserPool(poolData);