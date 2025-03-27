#include <iostream>
using namespace std;

int main() {
    int num;
    double sum = 0.0;

    cout << "Enter Number: ";
    cin >>  num;

    cout << "Sum Series of 1 + 1/2 + 1/3 + 1/4.. + 1/n is: " << endl;

    for(int i = 1; i <= num; i++){
       sum += 1.0/i;
    }

    cout << sum;

    return 0;
}

