#include <iostream>
using namespace std;

int main() {
    int num, t1, t2 = 0, t3 = 1;
    cout << "Enter Number: ";
    cin >>  num;

    cout << "Fibonacci Series of " << num << endl;

    for(int i = 0; i < num; i++){
          t1 = t2 + t3;
          t2 = t3;
          t3 = t1;
          cout << t3 << " ";
    }

    return 0;
}

