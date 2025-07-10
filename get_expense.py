import json
import boto3
from decimal import Decimal

def lambda_handler(event, context):
    print("Received event:", json.dumps(event))

    dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
    table = dynamodb.Table('ExpenseTracker')

    try:
        # Scan all items in the table
        response = table.scan()
        data = response['Items']

        # If there are more items, keep paginating
        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            data.extend(response['Items'])

        # Optional: Sort by date (descending)
        data.sort(key=lambda x: str(x.get('date', '')), reverse=True)

        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps(data, default=decimal_serializer)
        }

    except Exception as e:
        print("Error occurred:", str(e))
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': str(e)})
        }

# Converts Decimal to float
def decimal_serializer(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

# CORS headers for frontend
def cors_headers():
    return {
        'Access-Control-Allow-Origin': 'http://expense-tracker-project-1.s3-website.ap-south-1.amazonaws.com',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
    }
