import {Context} from "aws-cdk/lib/settings";

export const handler = async (event: string, context: Context) => {
        const message = 'Hello world'
        console.log(message)
        return {
            message
        }
}
